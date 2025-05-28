# nasabook-backend

Đây là phần backend cho hệ thống quản lý sách nasabook, tập trung vào các chức năng quản lý kho và sách.

## Cài đặt và Chạy dự án

Để cài đặt và chạy dự án này, bạn cần thực hiện các bước sau:

1.  **Clone repository** (Nếu bạn chưa làm)

2.  **Cài đặt Node.js và npm:** Đảm bảo bạn đã cài đặt Node.js (phiên bản đề xuất: 14 trở lên) và npm (thường đi kèm với Node.js).

3.  **Cài đặt MongoDB:** Dự án sử dụng MongoDB làm database. Bạn cần tải và cài đặt MongoDB Community Server hoặc sử dụng dịch vụ MongoDB Atlas. Hãy đảm bảo MongoDB server đang chạy.

4.  **Cài đặt dependencies:** Mở terminal trong thư mục gốc của dự án và chạy lệnh:
    ```bash
    npm install
    ```

5.  **Cấu hình biến môi trường:** Tạo một file `.env` ở thư mục gốc của dự án với nội dung sau (thay đổi các giá trị nếu cần):
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/nasabook
    # Bạn có thể thêm các biến môi trường khác ở đây sau này (ví dụ: JWT_SECRET, API_KEYS, ...)
    ```
    *Lưu ý:* Nếu bạn dùng MongoDB Atlas, `MONGODB_URI` sẽ là connection string được cung cấp bởi Atlas.

6.  **Cấu hình kết nối Database:** Kiểm tra file `src/config/db.config.js` để đảm bảo nó sử dụng biến môi trường `MONGODB_URI`.

7.  **Chạy server:** Mở terminal trong thư mục gốc của dự án và chạy lệnh phát triển:
    ```bash
    npm run dev
    ```
    Hoặc chạy production:
    ```bash
    npm start
    ```

    Server sẽ chạy và kết nối đến MongoDB. Bạn sẽ thấy thông báo như `Server is running on port 3000` và `MongoDB Connected: localhost` (hoặc tên host của bạn).

## Tài liệu API

Xem chi tiết các endpoint API và cách sử dụng trong file `API.md`.

## Cấu trúc thư mục chính

```
nasabook-backend/
├── node_modules/
├── src/
│   ├── business/         # Chứa business logic (Services)
│   │   └── services/
│   │       └── book.service.js
│   ├── config/           # Chứa cấu hình (DB connection, ...)
│   │   └── db.config.js
│   ├── data/             # Chứa models và tương tác DB
│   │   └── models/
│   │       ├── book.model.js
│   │       └── restockOrder.model.js # Thêm model này
│   ├── middlewares/      # Chứa các middleware (Auth, Error handling...)
│   │   └── error.middleware.js # Có thể thêm middleware xử lý lỗi
│   ├── presentation/     # Chứa lớp giao tiếp với client (Controllers, Routes)
│   │   ├── controllers/
│   │   │   └── book.controller.js
│   │   └── routes/
│   │       └── book.routes.js
│   └── app.js            # File khởi tạo ứng dụng Express
├── API.md                # Tài liệu API
├── package.json          # Thông tin dự án và dependencies
├── package-lock.json
└── README.md             # File này
```

## Công nghệ sử dụng

-   Node.js
-   Express.js
-   Mongoose (cho MongoDB)
-   MongoDB
-   PDFKit (để tạo PDF) - Cần `npm install pdfkit fs path` nếu chưa có
-   dotenv (để quản lý biến môi trường) - Cần `npm install dotenv` nếu chưa có
-   cors (nếu cần xử lý CORS) - Cần `npm install cors` nếu chưa có

---



