const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
//const { protect, authorize } = require('../../middlewares/auth.middleware'); // Import middleware

// Route thêm sách mới
router.post('/', bookController.createBook);

// Route lấy danh sách sách (có thể kèm filter, phân trang, sắp xếp)
router.get('/', bookController.getAllBooks);

// Route tìm kiếm sách theo tên, tác giả hoặc thể loại (UC-2.6)
router.get('/search', bookController.searchBooks);

// Routes cho chức năng Nhập thêm sách (UC-2.4)
router.get('/lowstock', bookController.getLowStockBooks); // Lấy danh sách sách sắp hết/đã hết
router.post('/restock', bookController.processRestockOrder); // Xử lý nhập thêm sách (tạo phiếu)

// Route để tăng số lượng sách cho một cuốn cụ thể (tương đương importMore)
router.put('/import/:id', bookController.importBookQuantity);

// Route để đánh dấu sách ngừng kinh doanh (tương đương markAsDiscontinued)
router.put('/discontinue/:id', bookController.markBookAsDiscontinued);

// Route để kiểm tra sách có còn hàng không (tương đương isAvailable)
router.get('/available/:id', bookController.isBookAvailable);

// Route để xác nhận phiếu nhập kho (chức năng mới bạn thêm)
// Đảm bảo route này có pattern rõ ràng hơn /:id, ví dụ /restock/confirm/:orderId
router.put('/restock/confirm/:orderId', bookController.confirmRestockOrder);

// Route tạo PDF phiếu nhập
router.get('/restock/:orderId/pdf', bookController.generateRestockPdf);

// Route cập nhật thông tin sách - ĐẶT TRƯỚC route /:id để nó hoạt động chính xác
router.put('/:id', bookController.updateBook);

// Route xóa sách - ĐẶT TRƯỚC route /:id để nó hoạt động chính xác
router.delete('/:id', bookController.deleteBook);

// Route để lấy thông tin chi tiết một cuốn sách theo ID - ĐẶT CUỐI CÙNG
router.get('/:id', bookController.getBookById);

module.exports = router;