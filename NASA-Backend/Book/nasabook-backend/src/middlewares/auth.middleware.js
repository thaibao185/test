// src/middlewares/auth.middleware.js

// Các thư viện này sẽ được sử dụng bởi logic authentication THẬT sau này
// const jwt = require('jsonwebtoken');
// const User = require('../data/models/user.model'); // Cần để tìm user trong DB

// Middleware xác thực (Authentication Middleware)
// Nhiệm vụ của nó là:
// 1. Lấy token từ header (Authorization: Bearer token)
// 2. Xác minh token (dùng JWT_SECRET)
// 3. Tìm user trong DB dựa vào ID từ token
// 4. Nếu thành công, đính kèm user vào req.user và gọi next()
// 5. Nếu thất bại (không token, token sai/hết hạn, user không tồn tại), trả về 401 Unauthorized
exports.protect = async (req, res, next) => {
    // --- Logic xác thực THẬT sẽ nằm ở đây (đang được comment lại) ---
    // const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null;
    // if (!token) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    // try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //     const user = await User.findById(decoded.id).select('-password');
    //     if (!user) return res.status(401).json({ success: false, message: 'User không tồn tại' });
    //     req.user = user; // Đính kèm user vào request
    //     next();
    // } catch (error) {
    //     res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn' });
    // }
    // --- Hết logic xác thực THẬT ---


    // --- STUB: Logic giả định cho mục đích phát triển phần sách ---
    // Giả định luôn có một user đã đăng nhập với vai trò nào đó
    // Bạn có thể thay đổi giá trị role ở đây để kiểm thử các trường hợp
    // Ví dụ: role: 'cua_hang_truong' để test quyền admin
    // Ví dụ: role: 'nhan_vien' để test quyền nhân viên
    req.user = {
        _id: 'stubUserId123', // ID giả
        username: 'stubUser', // Username giả
        role: 'cua_hang_truong' // <--- THAY ĐỔI VAI TRÒ Ở ĐÂY ĐỂ TEST KHÁC NHAU
        // Các thuộc tính khác của user nếu cần
    };

    console.log(`[AUTH STUB] User giả định: ${req.user.username} (${req.user.role})`);

    next(); // Luôn cho qua để controller được gọi
    // --- Hết STUB ---
};


// Middleware phân quyền (Authorization Middleware)
// Nhiệm vụ của nó là:
// 1. Nhận vào mảng các vai trò được phép (e.g., ['cua_hang_truong'])
// 2. Kiểm tra req.user.role (đã được đính kèm bởi middleware 'protect')
// 3. Nếu role của user KHÔNG nằm trong danh sách được phép, trả về 403 Forbidden
// 4. Nếu có quyền, gọi next()
exports.authorize = (roles = []) => {
    // roles là mảng các vai trò được phép (e.g., ['cua_hang_truong'])
    return (req, res, next) => {
        // Middleware này sẽ chạy SAU middleware 'protect', nên req.user chắc chắn đã tồn tại và hợp lệ

        // Kiểm tra xem vai trò của người dùng (req.user.role) có nằm trong mảng các vai trò được phép không
        // roles.includes(req.user.role) sẽ trả về true nếu vai trò của user có trong mảng roles
        console.log(`[AUTH STUB] Kiểm tra quyền cho vai trò: ${req.user.role}. Cần vai trò: ${roles.join(', ')}`);

        if (!roles.includes(req.user.role)) {
            // Nếu vai trò không nằm trong danh sách được phép
            // Trả về lỗi 403 Forbidden (Không có quyền)
            console.log(`[AUTH STUB] KHÔNG CÓ QUYỀN! Trả về 403`);
            return res.status(403).json({
                success: false,
                message: `Người dùng với vai trò ${req.user.role} không được phép truy cập tài nguyên này`
            });
        }

        // Nếu người dùng có vai trò được phép, chuyển tiếp
        console.log(`[AUTH STUB] CÓ QUYỀN. Tiếp tục xử lý.`);
        next();
    };
};