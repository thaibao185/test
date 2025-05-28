const Book = require('../../data/models/book.model');
const RestockOrder = require('../../data/models/restockOrder.model');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const STOCK_THRESHOLD = 10;
const MIN_RESTOCK_QUANTITY = 5;  // Số lượng tối thiểu cho mỗi lần nhập
const MAX_RESTOCK_QUANTITY = 100; // Số lượng tối đa cho mỗi lần nhập

class BookService {
    // Thêm sách mới
    async createBook(bookData) {
        try {
            const book = new Book(bookData);
            return await book.save();
        } catch (error) {
            throw error;
        }
    }

    // Lấy danh sách sách
    async getAllBooks(queryOptions = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'title', order = 1, category, author, minPrice, maxPrice } = queryOptions;

            // Xây dựng điều kiện lọc
            const filter = { isDeleted: false };
            if (category) {
                filter.category = category; // Lọc theo thể loại
            }
            if (author) {
                filter.author = author; // Lọc theo tác giả
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                filter.price = {};
                if (minPrice !== undefined) {
                    filter.price.$gte = minPrice; // Lọc giá từ minPrice trở lên
                }
                if (maxPrice !== undefined) {
                    filter.price.$lte = maxPrice; // Lọc giá đến maxPrice trở xuống
                }
            }

            // Tính toán skip và limit cho phân trang
            const skip = (page - 1) * limit;

            // Lấy tổng số sách phù hợp với điều kiện lọc (không phân trang)
            const totalBooks = await Book.countDocuments(filter);

            // Thực hiện query với lọc, phân trang, và sắp xếp
            const books = await Book.find(filter)
                .select('title author price quantity description category publisher priceImport status coverImage')
                .sort({ [sortBy]: order }) // Sắp xếp theo sortBy và order
                .skip(skip)
                .limit(limit);

            return {
                total: totalBooks, // Tổng số sách (không phân trang)
                page: page,
                limit: limit,
                books: books
            };
        } catch (error) {
            throw error;
        }
    }

    // Lấy thông tin một cuốn sách
    async getBookById(id) {
        try {
            const book = await Book.findOne({ _id: id, isDeleted: false });
            if (!book) {
                throw new Error('Không tìm thấy sách');
            }
            return book;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật thông tin sách
    async updateBook(id, updateData) {
        try {
            // Tìm sách trước để kiểm tra số lượng hiện tại và các trường khác nếu cần
            const book = await Book.findOne({ _id: id, isDeleted: false });

            if (!book) {
                throw new Error('Không tìm thấy sách');
            }

            // Áp dụng các cập nhật từ updateData
            Object.assign(book, updateData);

            // Logic tự động cập nhật status dựa trên quantity nếu quantity được thay đổi VÀ status không được gửi trong updateData
            if (updateData.hasOwnProperty('quantity') && !updateData.hasOwnProperty('status')) {
                if (book.quantity === 0) {
                    book.status = 'Out of Stock';
                } else if (book.quantity > 0 && book.status === 'Out of Stock') {
                    // Nếu số lượng > 0 và trước đó đang hết hàng, chuyển sang Available
                    book.status = 'Available';
                } else if (book.quantity > 0 && book.status === 'Discontinued') {
                    // Nếu số lượng > 0 và đang ngừng kinh doanh, giữ nguyên trạng thái Discontinued
                    // Không làm gì ở đây
                } else if (book.quantity > 0 && book.status === 'Available') {
                    // Nếu số lượng > 0 và đang Available, giữ nguyên trạng thái Available
                    // Không làm gì ở đây
                }
            }

            // Lưu các thay đổi vào DB (bao gồm cả status nếu có thay đổi tự động hoặc từ updateData)
            await book.save({
                runValidators: true // Chạy validator của Mongoose schema
            });

            return book;
        } catch (error) {
            throw error;
        }
    }

    // Xóa sách (soft delete)
    async deleteBook(id) {
        try {
            const book = await Book.findOneAndUpdate(
                { _id: id, isDeleted: false },
                { isDeleted: true },
                { new: true }
            );
            if (!book) {
                throw new Error('Không tìm thấy sách');
            }
            return book;
        } catch (error) {
            throw error;
        }
    }

    //////// Quản lý kho sách ////////
    async getLowStockBooks() {
        try {
            // Tìm sách có quantity <= ngưỡng và chưa bị xóa mềm
            const lowStockBooks = await Book.find({
                isDeleted: false,
                quantity: { $lte: STOCK_THRESHOLD }
            }).select('_id title author quantity'); // Chỉ lấy các trường cần thiết

            // Thêm trường warningLevel và phân loại
            const booksWithWarnings = lowStockBooks.map(book => {
                let warningLevel = '';
                if (book.quantity === 0) {
                    warningLevel = 'Out of Stock';
                } else if (book.quantity > 0 && book.quantity <= STOCK_THRESHOLD) {
                    warningLevel = 'Low Stock';
                }
                // Không cần else cho quantity > STOCK_THRESHOLD vì chúng ta chỉ query sách <= STOCK_THRESHOLD

                return {
                    _id: book._id,
                    title: book.title,
                    author: book.author,
                    quantity: book.quantity,
                    warningLevel: warningLevel // Thêm trường warningLevel
                };
            });

            // Phân loại thành sắp hết (>0) và đã hết (=0) dựa trên quantity
            const outOfStock = booksWithWarnings.filter(book => book.quantity === 0);
            const lowStock = booksWithWarnings.filter(book => book.quantity > 0);

            return { outOfStock, lowStock }; // outOfStock và lowStock giờ đây chứa các đối tượng có warningLevel

        } catch (error) {
            throw error;
        }
    }

    // Hàm xử lý phiếu nhập thêm sách (UC-2.4)
    async processRestockOrder(restockData, userCreatingOrder) {
        if (!Array.isArray(restockData) || restockData.length === 0) {
            throw new Error('Dữ liệu nhập sách không hợp lệ');
        }

        // Validate book IDs exist
        const bookIds = restockData.map(item => item.bookId);
        const existingBooks = await Book.find({ _id: { $in: bookIds } });

        if (existingBooks.length !== bookIds.length) {
            throw new Error('Một hoặc nhiều sách không tồn tại');
        }

        // Validate quantities
        for (const item of restockData) {
            if (item.quantity < MIN_RESTOCK_QUANTITY) {
                throw new Error(`Số lượng nhập cho sách ${item.bookId} phải lớn hơn hoặc bằng ${MIN_RESTOCK_QUANTITY}`);
            }
            if (item.quantity > MAX_RESTOCK_QUANTITY) {
                throw new Error(`Số lượng nhập cho sách ${item.bookId} không được vượt quá ${MAX_RESTOCK_QUANTITY}`);
            }
        }

        // Map bookId thành book để phù hợp với schema
        const orderItems = restockData.map(item => ({
            book: item.bookId,
            quantity: item.quantity
        }));

        // Create restock order
        const restockOrder = new RestockOrder({
            orderItems: orderItems,
            status: 'pending',
            createdBy: userCreatingOrder._id
        });

        await restockOrder.save();
        return restockOrder;
    }

    // Hàm xác nhận phiếu nhập kho
    async confirmRestockOrder(orderId, user) {
        try {
            // Kiểm tra quyền người dùng
            if (!user || user.role !== 'manager') {
                throw new Error('Chỉ Cửa hàng trưởng mới được phép xác nhận phiếu nhập kho');
            }

            // Tìm phiếu nhập và cập nhật trạng thái
            const order = await RestockOrder.findById(orderId);
            if (!order) {
                throw new Error('Không tìm thấy phiếu nhập');
            }

            if (order.status !== 'pending') {
                throw new Error('Phiếu nhập không ở trạng thái chờ xác nhận');
            }

            // Cập nhật trạng thái phiếu nhập
            order.status = 'confirmed';
            order.confirmedBy = user._id;
            order.confirmedAt = new Date();

            // Cập nhật số lượng sách trong kho
            for (const item of order.items) {
                const book = await Book.findById(item.book);
                if (!book) {
                    throw new Error(`Không tìm thấy sách với ID ${item.book}`);
                }
                book.quantity += item.quantity;
                if (book.quantity > 0 && book.status === 'Out of Stock') {
                    book.status = 'Available';
                }
                await book.save();
            }

            // Lưu phiếu nhập đã xác nhận
            await order.save();

            return order;
        } catch (error) {
            throw error;
        }
    }

    // Hàm tạo PDF phiếu nhập
    async generateRestockPdf(orderId) {
        try {
            const order = await RestockOrder.findById(orderId)
                .populate('items.book', 'title author')
                .populate('createdBy', 'username');

            if (!order) {
                throw new Error('Không tìm thấy phiếu nhập');
            }

            // Tạo PDF
            const doc = new PDFDocument();
            const pdfPath = path.join(__dirname, `../../temp/restock_${orderId}.pdf`);

            // Đảm bảo thư mục temp tồn tại
            if (!fs.existsSync(path.join(__dirname, '../../temp'))) {
                fs.mkdirSync(path.join(__dirname, '../../temp'));
            }

            // Tạo stream để ghi file
            const stream = fs.createWriteStream(pdfPath);
            doc.pipe(stream);

            // Thêm nội dung vào PDF
            doc.fontSize(20).text('PHIẾU NHẬP KHO', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Mã phiếu: ${order._id}`);
            doc.text(`Ngày tạo: ${order.createdAt.toLocaleDateString('vi-VN')}`);
            doc.text(`Người tạo: ${order.createdBy ? order.createdBy.username : 'Không xác định'}`);
            doc.moveDown();

            // Tạo bảng danh sách sách
            const tableTop = 200;
            doc.fontSize(12).text('Danh sách sách cần nhập:', 50, tableTop);

            let y = tableTop + 30;
            doc.fontSize(10);
            doc.text('STT', 50, y);
            doc.text('Tên sách', 100, y);
            doc.text('Tác giả', 300, y);
            doc.text('Số lượng', 450, y);

            y += 20;
            order.items.forEach((item, index) => {
                doc.text(`${index + 1}`, 50, y);
                doc.text(item.book.title, 100, y);
                doc.text(item.book.author, 300, y);
                doc.text(item.quantity.toString(), 450, y);
                y += 20;
            });

            // Kết thúc PDF
            doc.end();

            return new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(pdfPath));
                stream.on('error', reject);
            });
        } catch (error) {
            throw error;
        }
    }

    // Thêm các hàm này vào trong class BookService {}

    // Tìm kiếm sách theo tên, tác giả hoặc thể loại
    async searchBooks(searchTerm) {
        try {
            if (!searchTerm) {
                return { books: [], total: 0 };
            }

            const searchRegex = new RegExp(searchTerm, 'i'); // 'i' để tìm kiếm không phân biệt hoa thường

            const books = await Book.find({
                isDeleted: false,
                $or: [
                    { title: searchRegex },
                    { author: searchRegex },
                    { category: searchRegex }
                ]
            })
                .select('title author price quantity description category publisher priceImport status coverImage')
                .sort({ title: 1 });

            return {
                books: books,
                total: books.length
            };
        } catch (error) {
            throw error;
        }
    }

    // Tăng số lượng sách (tương đương importMore trong sơ đồ)
    async importBookQuantity(bookId, quantity) {
        try {
            const book = await Book.findOne({ _id: bookId, isDeleted: false });
            if (!book) {
                throw new Error('Không tìm thấy sách để nhập thêm');
            }

            if (quantity <= 0) {
                throw new Error('Số lượng nhập thêm phải lớn hơn 0');
            }

            // TODO: Áp dụng BookImportRule nếu cần (min/max quantity)

            book.quantity += quantity;
            // Nếu sách đang hết hàng và được nhập thêm, có thể cập nhật lại status
            if (book.status === 'Out of Stock' && book.quantity > 0) {
                book.status = 'Available';
            }

            return await book.save();
        } catch (error) {
            throw error;
        }
    }

    // Đánh dấu sách ngừng kinh doanh (tương đương markAsDiscontinued trong sơ đồ)
    async markBookAsDiscontinued(bookId) {
        try {
            const book = await Book.findOne({ _id: bookId, isDeleted: false });
            if (!book) {
                throw new Error('Không tìm thấy sách để đánh dấu ngừng kinh doanh');
            }

            // Chỉ cập nhật status nếu sách chưa bị đánh dấu là ngừng kinh doanh
            if (book.status !== 'Discontinued') {
                book.status = 'Discontinued';
                return await book.save();
            }
            return book; // Trả về sách mà không lưu nếu đã ngừng kinh doanh
        } catch (error) {
            throw error;
        }
    }

    // Kiểm tra sách có còn hàng và không ngừng kinh doanh (tương đương isAvailable trong sơ đồ)
    async isBookAvailable(bookId) {
        try {
            const book = await Book.findOne({ _id: bookId, isDeleted: false });
            if (!book) {
                // Sách không tồn tại hoặc đã bị xóa mềm => không available
                return false;
            }

            // Sách available nếu số lượng > 0 và status không phải là 'Discontinued'
            return book.quantity > 0 && book.status !== 'Discontinued';

        } catch (error) {
            // Nếu có lỗi xảy ra khi kiểm tra, coi như không available để an toàn
            console.error(`Error checking book availability for ID ${bookId}:`, error);
            return false;
        }
    }
}

module.exports = new BookService();