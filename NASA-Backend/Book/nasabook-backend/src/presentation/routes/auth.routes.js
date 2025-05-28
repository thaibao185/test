// src/presentation/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); // Đường dẫn này đi lên 1 cấp presentation, rồi vào controllers

// Route đăng ký người dùng (CHỈ DÙNG CHO THIẾT LẬP BAN ĐẦU)
// Bạn có thể comment hoặc xóa route này sau khi tạo user admin/cua_hang_truong
router.post('/register', authController.register);

// Route đăng nhập
router.post('/login', authController.login);

module.exports = router;