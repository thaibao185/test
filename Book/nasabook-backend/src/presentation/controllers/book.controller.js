const bookService = require('../../business/services/book.service');
const mongoose = require('mongoose'); // Import mongoose để kiểm tra loại lỗi
const { STOCK_THRESHOLD } = require('../../business/services/book.service'); // Import STOCK_THRESHOLD từ service
const path = require('path'); // Import path module

class BookController {
    // Thêm sách mới
    async createBook(req, res, next) { // Thêm 'next' vào tham số
        try {
            const book = await bookService.createBook(req.body);
            res.status(201).json({
                success: true,
                message: 'Thêm sách thành công',
                data: book
            });
        } catch (error) {
            // Kiểm tra nếu là lỗi Mongoose Validation
            if (error.name === 'ValidationError') {
                res.status(400).json({
                    success: false,
                    message: error.message // Mongoose validation error message đã chi tiết
                });
            } else {
                // Nếu không phải validation error, ném lỗi cho middleware xử lý
                next(error);
            }
        }
    }

    // Lấy danh sách sách (thường lỗi ở đây là lỗi server, có thể dùng try/catch hoặc để middleware bắt)
    async getAllBooks(req, res, next) { // Thêm 'next'
        try {
            // Lấy các tham số phân trang và lọc từ req.query
            const queryOptions = {
                page: parseInt(req.query.page) || 1, // Trang hiện tại, mặc định là 1
                limit: parseInt(req.query.limit) || 10, // Số lượng sách trên mỗi trang, mặc định là 10
                sortBy: req.query.sortBy || 'title', // Trường sắp xếp, mặc định là title
                order: parseInt(req.query.order) || 1, // Thứ tự sắp xếp (1: ASC, -1: DESC), mặc định là 1
                category: req.query.category, // Lọc theo thể loại
                author: req.query.author, // Lọc theo tác giả
                minPrice: parseFloat(req.query.minPrice), // Lọc giá từ (chuyển sang số thực)
                maxPrice: parseFloat(req.query.maxPrice), // Lọc giá đến (chuyển sang số thực)
            };

            // Loại bỏ các tham số undefined hoặc NaN sau khi parse để không ảnh hưởng đến query
            Object.keys(queryOptions).forEach(key => {
                if (queryOptions[key] === undefined || (typeof queryOptions[key] === 'number' && isNaN(queryOptions[key]))) {
                    delete queryOptions[key];
                }
            });

            const result = await bookService.getAllBooks(queryOptions); // Truyền queryOptions cho service
            res.status(200).json({
                success: true,
                data: result // service đã trả về result bao gồm total, page, limit và books
            });
        } catch (error) {
            // Lỗi khi lấy danh sách thường là lỗi server/DB
            next(error);
        }
    }

    // Lấy thông tin một cuốn sách
    async getBookById(req, res, next) {
        try {
            const book = await bookService.getBookById(req.params.id);
            res.status(200).json({
                success: true,
                data: book
            });
        } catch (error) {
            if (error.message.startsWith('Không tìm thấy sách')) {
                res.status(404).json({ success: false, message: error.message }); // Sách không tồn tại
            } else if (error instanceof mongoose.Error.CastError) {
                res.status(400).json({ success: false, message: 'ID sách không hợp lệ' });
            }
            else {
                next(error);
            }
        }
    }


    // Cập nhật thông tin sách
    async updateBook(req, res, next) { // Thêm 'next'
        try {
            const book = await bookService.updateBook(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Cập nhật sách thành công',
                data: book
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else if (error instanceof mongoose.Error.CastError) {
                // Xử lý lỗi CastError nếu ID không đúng định dạng
                res.status(400).json({
                    success: false,
                    message: 'ID sách không hợp lệ'
                });
            } else if (error.message.startsWith('Không tìm thấy sách')) {
                res.status(404).json({ success: false, message: error.message }); // Sách không tồn tại
            }
            else {
                next(error);
            }
        }
    }

    // Xóa sách
    async deleteBook(req, res, next) { // Thêm 'next'
        try {
            await bookService.deleteBook(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Xóa sách thành công'
            });
        } catch (error) {
            if (error.message.startsWith('Không tìm thấy sách')) {
                res.status(404).json({ success: false, message: error.message }); // Sách không tồn tại
            } else if (error instanceof mongoose.Error.CastError) {
                // Xử lý lỗi CastError nếu ID không đúng định dạng
                res.status(400).json({
                    success: false,
                    message: 'ID sách không hợp lệ'
                });
            }
            else {
                next(error);
            }
        }
    }

    //////// Quản lý kho sách ////////
    // Controller lấy danh sách sách sắp hết/đã hết (UC-2.4 Step 3)
    // Endpoint: GET /api/books/lowstock
    async getLowStockBooks(req, res, next) {
        try {
            // req.user không còn được đảm bảo tồn tại ở đây nữa
            const { outOfStock, lowStock } = await bookService.getLowStockBooks();
            res.status(200).json({
                success: true,
                data: {
                    threshold: STOCK_THRESHOLD, // Trả về ngưỡng để frontend hiển thị
                    outOfStock, // Danh sách sách đã hết (quantity === 0)
                    lowStock // Danh sách sách sắp hết (0 < quantity <= threshold)
                }
            });
        } catch (error) {
            next(error); // Chuyển lỗi cho middleware xử lý chung
        }
    }

    // Controller xử lý phiếu nhập thêm sách (UC-2.4)
    // Endpoint: POST /api/books/restock
    async processRestockOrder(req, res, next) {
        try {
            console.log('Received restock data:', req.body); // <-- Giữ dòng này để debug

            const restockData = req.body.items; // Frontend gửi mảng [{ bookId: '...', quantity: ... }, ...]

            // Tạo user giả cho mục đích test, sau này cần lấy từ req.user
            // const userCreatingOrder = { _id: req.user._id };
            const userCreatingOrder = { _id: new mongoose.Types.ObjectId() }; // User giả

            // Gọi service để tạo phiếu nhập
            const restockOrder = await bookService.processRestockOrder(restockData, userCreatingOrder);

            // Trả về thông báo thành công và dữ liệu phiếu nhập dưới dạng JSON
            res.status(200).json({
                success: true,
                message: 'Phiếu nhập kho đã được tạo thành công',
                data: restockOrder
            });

        } catch (error) {
            if (error.message.startsWith('Dữ liệu nhập sách không hợp lệ') || error.message.startsWith('Một hoặc nhiều sách không tồn tại') || error.message.startsWith('Số lượng nhập cho sách')) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                next(error);
            }
        }
    }

    // Controller tìm kiếm sách (UC-2.6)
    async searchBooks(req, res, next) {
        try {
            const { searchTerm } = req.query;

            const result = await bookService.searchBooks(searchTerm);

            if (result.total === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Không tìm thấy kết quả phù hợp',
                    data: { books: [], total: 0 }
                });
            }

            res.status(200).json({
                success: true,
                message: 'Tìm kiếm thành công',
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    // Controller để tăng số lượng sách cho một cuốn cụ thể (tương đương importMore)
    async importBookQuantity(req, res, next) {
        try {
            const { id } = req.params; // Lấy ID sách từ URL
            const { quantity } = req.body; // Lấy số lượng cần nhập từ body

            // Validate quantity
            if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
                return res.status(400).json({ success: false, message: 'Số lượng nhập không hợp lệ' });
            }

            const updatedBook = await bookService.importBookQuantity(id, quantity);

            res.status(200).json({
                success: true,
                message: `Đã nhập thêm ${quantity} cuốn cho sách ${updatedBook.title}`, // Thông báo thành công
                data: updatedBook // Trả về thông tin sách sau khi cập nhật
            });

        } catch (error) {
            if (error.message.startsWith('Không tìm thấy sách') || error.message.startsWith('Số lượng nhập thêm phải lớn hơn 0')) {
                res.status(400).json({ success: false, message: error.message });
            } else if (error instanceof mongoose.Error.CastError) {
                res.status(400).json({ success: false, message: 'ID sách không hợp lệ' });
            }
            else {
                next(error); // Chuyển lỗi cho middleware xử lý
            }
        }
    }

    // Controller để đánh dấu sách ngừng kinh doanh (tương đương markAsDiscontinued)
    async markBookAsDiscontinued(req, res, next) {
        try {
            const { id } = req.params; // Lấy ID sách từ URL

            const updatedBook = await bookService.markBookAsDiscontinued(id);

            res.status(200).json({
                success: true,
                message: `Sách ${updatedBook.title} đã được đánh dấu ngừng kinh doanh`, // Thông báo thành công
                data: updatedBook // Trả về thông tin sách sau khi cập nhật
            });

        } catch (error) {
            if (error.message.startsWith('Không tìm thấy sách')) {
                res.status(400).json({ success: false, message: error.message });
            } else if (error instanceof mongoose.Error.CastError) {
                res.status(400).json({ success: false, message: 'ID sách không hợp lệ' });
            }
            else {
                next(error); // Chuyển lỗi cho middleware xử lý
            }
        }
    }

    // Controller để kiểm tra sách có còn hàng không (tương đương isAvailable)
    async isBookAvailable(req, res, next) {
        try {
            const { id } = req.params; // Lấy ID sách từ URL

            const isAvailable = await bookService.isBookAvailable(id);

            res.status(200).json({
                success: true,
                data: { isAvailable: isAvailable } // Trả về kết quả kiểm tra
            });

        } catch (error) {
            // Lỗi khi kiểm tra khả dụng có thể do nhiều nguyên nhân, chuyển cho middleware
            // Hoặc có thể xử lý riêng lỗi CastError nếu ID không hợp lệ
            if (error instanceof mongoose.Error.CastError) {
                res.status(400).json({ success: false, message: 'ID sách không hợp lệ' });
            }
            else {
                next(error); // Chuyển lỗi cho middleware xử lý
            }
        }
    }

    // Controller để xác nhận phiếu nhập kho
    async confirmRestockOrder(req, res, next) {
        try {
            const { orderId } = req.params;

            // Tạo user giả cho mục đích test
            const user = {
                _id: new mongoose.Types.ObjectId(),
                role: 'manager' // Thêm role để pass qua check trong service
            };

            const confirmedOrder = await bookService.confirmRestockOrder(orderId, user);

            res.status(200).json({
                success: true,
                message: 'Phiếu nhập kho đã được xác nhận và số lượng sách đã được cập nhật',
                data: confirmedOrder
            });
        } catch (error) {
            if (error.message.startsWith('Không tìm thấy phiếu nhập') ||
                error.message.startsWith('Phiếu nhập không ở trạng thái chờ xác nhận') ||
                error.message.startsWith('Chỉ Cửa hàng trưởng mới được phép xác nhận phiếu nhập')) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                next(error);
            }
        }
    }

    // Controller để tạo PDF phiếu nhập
    async generateRestockPdf(req, res, next) {
        try {
            const { orderId } = req.params; // Lấy ID phiếu nhập từ URL

            const pdfPath = await bookService.generateRestockPdf(orderId);

            // Gửi file PDF về client
            res.download(pdfPath, `phieu_nhap_kho_${orderId}.pdf`, (err) => {
                if (err) {
                    console.error('Error sending PDF file:', err);
                    // Nếu có lỗi khi gửi file, chuyển tiếp lỗi
                    next(err);
                } else {
                    // Xóa file PDF tạm sau khi gửi xong
                    fs.unlink(pdfPath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting temporary PDF file:', unlinkErr);
                        }
                    });
                }
            });

        } catch (error) {
            if (error.message.startsWith('Không tìm thấy phiếu nhập')) {
                res.status(400).json({ success: false, message: error.message });
            } else if (error instanceof mongoose.Error.CastError) {
                res.status(400).json({ success: false, message: 'ID phiếu nhập không hợp lệ' });
            }
            else {
                next(error); // Chuyển lỗi cho middleware xử lý
            }
        }
    }

}

module.exports = new BookController();