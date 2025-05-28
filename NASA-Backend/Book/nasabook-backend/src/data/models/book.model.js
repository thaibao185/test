const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tên sách là bắt buộc'],
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Tác giả là bắt buộc'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Thể loại là bắt buộc'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Giá bán là bắt buộc'],
        min: [0, 'Giá không được âm']
    },
    quantity: {
        type: Number,
        required: [true, 'Số lượng là bắt buộc'],
        min: [0, 'Số lượng không được âm']
    },
    image: {
        type: String,
        required: [true, 'Hình ảnh là bắt buộc'],
        // Thêm custom validator
        validate: {
            validator: function (v) {
                // Sử dụng regex để kiểm tra đuôi file
                return /\.(jpg|jpeg|png|gif)$/i.test(v);
            },
            message: props => `${props.value} không phải là URL hình ảnh hợp lệ (chỉ chấp nhận .jpg, .jpeg, .png, .gif)!`
        }
    },
    publisher: {
        type: String,
        required: [true, 'Nhà xuất bản là bắt buộc'],
        trim: true
    },
    priceImport: {
        type: Number,
        required: [true, 'Giá nhập là bắt buộc'],
        min: [0, 'Giá nhập không được âm']
    },
    description: {
        type: String,
        required: [true, 'Mô tả là bắt buộc']
    },
    status: {
        type: String,
        required: [true, 'Trạng thái là bắt buộc'],
        trim: true,
        enum: ['Available', 'Out of Stock', 'Discontinued'],
        default: 'Available'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);