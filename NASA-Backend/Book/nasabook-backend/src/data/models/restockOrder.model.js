const mongoose = require('mongoose');

// Schema cho từng đầu sách trong phiếu nhập
const restockItemSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book', // Tham chiếu đến model Book
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Số lượng nhập phải lớn hơn 0']
    },
    // Có thể thêm giá nhập, thành tiền cho từng đầu sách nếu cần
});

// Schema cho phiếu nhập kho tổng thể
const restockOrderSchema = new mongoose.Schema({
    orderItems: [restockItemSchema], // Mảng các đầu sách và số lượng nhập
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Người tạo phiếu nhập (ID của Cửa hàng trưởng)
        required: false // Tạm thời cho phép null khi chưa tích hợp Auth
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'], // Trạng thái phiếu nhập
        default: 'completed' // Thường thì sau khi tạo là coi như hoàn thành nhập
    },
    // Các trường khác có thể thêm: totalAmount, supplier, notes, etc.
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

module.exports = mongoose.model('RestockOrder', restockOrderSchema);