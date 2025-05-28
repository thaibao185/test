const fs = require('fs');
const path = require('path');

const folders = [
    'nasabook-backend/src/presentation/controllers',
    'nasabook-backend/src/presentation/routes',
    'nasabook-backend/src/business/services',
    'nasabook-backend/src/data/models',
    'nasabook-backend/src/middlewares',
    'nasabook-backend/src/config',
    'nasabook-backend/src/utils'
];

const files = [
    '.env',
    'package.json',
    'README.md',
    'src/app.js',
    'src/config/db.config.js',
    'src/utils/logger.js',
    'src/middlewares/error.middleware.js',
    'src/data/models/book.model.js',
    'src/business/services/book.service.js',
    'src/presentation/controllers/book.controller.js',
    'src/presentation/routes/book.routes.js'
];

// Tạo thư mục
folders.forEach(folder => {
    const fullPath = path.join(__dirname, folder);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Tạo file
files.forEach(file => {
    const fullPath = path.join(__dirname, 'nasabook-backend', file);
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, '', 'utf8');
    }
});

console.log('✅ Đã tạo xong cấu trúc thư mục và file!');
