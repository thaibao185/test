# API Documentation - Hệ thống Quản lý Sách

## Base URL
```
http://localhost:3000/api
```

## Authentication & Authorization (Chưa triển khai đầy đủ)

Hiện tại, các API quản lý sách chưa yêu cầu xác thực. Khi tích hợp với module Auth, các endpoint cần phân quyền sẽ được bảo vệ bằng middleware.

## Endpoints

### 1. Quản lý Sách

#### 1.1. Lấy danh sách sách
- **URL**: `/books`
- **Method**: `GET`
- **Description**: Lấy danh sách tất cả sách trong cửa hàng. Hỗ trợ phân trang, lọc và sắp xếp.
- **Query Parameters**:
  - `page` (optional): Số trang (mặc định: 1)
  - `limit` (optional): Số lượng sách trên mỗi trang (mặc định: 10)
  - `sortBy` (optional): Trường sắp xếp (ví dụ: `title`, `author`, `price`, `quantity`).
  - `order` (optional): Thứ tự sắp xếp (`1` cho ASC, `-1` cho DESC) (mặc định: 1)
  - `category` (optional): Lọc theo thể loại.
  - `author` (optional): Lọc theo tác giả.
  - `minPrice` (optional): Lọc giá từ.
  - `maxPrice` (optional): Lọc giá đến.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "total": "number", // Tổng số sách theo bộ lọc
      "page": "number",
      "limit": "number",
      "books": [
        {
          "_id": "string",
          "title": "string",
          "author": "string",
          "price": "number",
          "quantity": "number",
          "description": "string",
          "category": "string",
          "publisher": "string",
          "priceImport": "number", // Thêm trường priceImport
          "status": "string",    // Thêm trường status
          "coverImage": "string",
          "isDeleted": "boolean", // Thêm trường soft delete
          "createdAt": "string",
          "updatedAt": "string"
        }
      ]
    }
  }
  ```

#### 1.2. Tìm kiếm sách
- **URL**: `/books/search`
- **Method**: `GET`
- **Description**: Tìm kiếm sách theo tên, tác giả hoặc thể loại (không phân biệt hoa thường).
- **Query Parameters**: 
  - `searchTerm`: Từ khóa tìm kiếm (bắt buộc).
- **Response**:
  ```json
  {
    "success": true,
    "message": "Tìm kiếm thành công" OR "Không tìm thấy kết quả phù hợp",
    "data": {
      "books": [
         {
          "_id": "string",
          "title": "string",
          "author": "string",
          "price": "number",
          "quantity": "number",
          "description": "string",
          "category": "string",
          "publisher": "string",
          "priceImport": "number",
          "status": "string",
          "coverImage": "string",
          "isDeleted": "boolean",
          "createdAt": "string",
          "updatedAt": "string"
        }
      ],
      "total": "number" // Tổng số sách phù hợp với tìm kiếm
    }
  }
  ```

#### 1.3. Lấy thông tin chi tiết sách
- **URL**: `/books/:id`
- **Method**: `GET`
- **Description**: Lấy thông tin chi tiết của một cuốn sách theo ID.
- **Parameters**: 
  - `id`: ID của sách cần lấy thông tin.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "title": "string",
      "author": "string",
      "price": "number",
      "quantity": "number",
      "description": "string",
      "category": "string",
      "publisher": "string",
      "priceImport": "number",
      "status": "string",
      "coverImage": "string",
      "isDeleted": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
  ```

#### 1.4. Thêm sách mới
- **URL**: `/books`
- **Method**: `POST`
- **Description**: Thêm một cuốn sách mới vào hệ thống.
- **Body**:
  ```json
  {
    "title": "string", (required)
    "author": "string", (required)
    "price": "number", (required, > 0)
    "quantity": "number", (required, >= 0)
    "description": "string",
    "category": "string", (required)
    "publisher": "string",
    "priceImport": "number", (required, > 0)
    "status": "string" (optional, default: 'Available' if quantity > 0, 'Out of Stock' if quantity === 0)
    "coverImage": "string" (optional, URL format validation)
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Thêm sách thành công",
    "data": { ... // Thông tin sách vừa thêm }
  }
  ```

#### 1.5. Cập nhật thông tin sách
- **URL**: `/books/:id`
- **Method**: `PUT`
- **Description**: Cập nhật thông tin của một cuốn sách theo ID. Chỉ cần gửi các trường muốn cập nhật.
- **Parameters**: 
  - `id`: ID của sách cần cập nhật (bắt buộc).
- **Body**: Có thể bao gồm bất kỳ trường nào của sách với giá trị mới (tương tự 1.4).
- **Response**:
  ```json
  {
    "success": true,
    "message": "Cập nhật sách thành công",
    "data": { ... // Thông tin sách sau khi cập nhật }
  }
  ```

#### 1.6. Xóa sách (Soft Delete)
- **URL**: `/books/:id`
- **Method**: `DELETE`
- **Description**: Đánh dấu một cuốn sách là đã xóa mềm (`isDeleted: true`). Sách sẽ không còn hiển thị trong danh sách mặc định.
- **Parameters**: 
  - `id`: ID của sách cần xóa mềm (bắt buộc).
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa sách thành công"
  }
  ```

#### 1.7. Tăng số lượng sách (Import More)
- **URL**: `/books/import/:id`
- **Method**: `PUT`
- **Description**: Tăng số lượng tồn kho cho một cuốn sách cụ thể.
- **Parameters**: 
  - `id`: ID của sách cần nhập thêm (bắt buộc).
- **Body**:
  ```json
  {
    "quantity": "number" // Số lượng cần nhập thêm (bắt buộc, > 0)
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đã nhập thêm X cuốn cho sách Y",
    "data": { ... // Thông tin sách sau khi cập nhật }
  }
  ```

#### 1.8. Đánh dấu sách ngừng kinh doanh (Mark as Discontinued)
- **URL**: `/books/discontinue/:id`
- **Method**: `PUT`
- **Description**: Đánh dấu một cuốn sách là đã ngừng kinh doanh.
- **Parameters**: 
  - `id`: ID của sách cần đánh dấu (bắt buộc).
- **Body**: (Không cần body)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đã đánh dấu sách X ngừng kinh doanh",
    "data": { ... // Thông tin sách sau khi cập nhật }
  }
  ```

#### 1.9. Kiểm tra sách có còn hàng không (Is Available)
- **URL**: `/books/available/:id`
- **Method**: `GET`
- **Description**: Kiểm tra xem một cuốn sách có còn hàng và không bị ngừng kinh doanh không.
- **Parameters**: 
  - `id`: ID của sách cần kiểm tra (bắt buộc).
- **Response**:
  ```json
  {
    "success": true,
    "data": "boolean" // true nếu sách còn hàng và không ngừng kinh doanh, false nếu ngược lại
  }
  ```

### 2. Quản lý Nhập Kho (Restock)

#### 2.1. Xem sách sắp hết/đã hết
- **URL**: `/books/lowstock`
- **Method**: `GET`
- **Description**: Lấy danh sách sách có số lượng tồn kho thấp hoặc đã hết.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "threshold": "number", // Ngưỡng tồn kho thấp
      "outOfStock": [
        { "_id": "string", "title": "string", "author": "string", "quantity": 0, "warningLevel": "Out of Stock" }
        // ...
      ],
      "lowStock": [
        { "_id": "string", "title": "string", "author": "string", "quantity": "number", "warningLevel": "Low Stock" }
        // ...
      ]
    }
  }
  ```

#### 2.2. Tạo phiếu nhập kho
- **URL**: `/books/restock`
- **Method**: `POST`
- **Description**: Tạo một phiếu đề xuất nhập thêm sách vào kho.
- **Body**:
  ```json
  {
    "items": [
      {
        "bookId": "string",    // ID sách (bắt buộc)
        "quantity": "number" // Số lượng cần nhập cho sách này (bắt buộc, từ 5 đến 100 theo quy định)
      }
      // ... có thể có nhiều item trong mảng
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Phiếu nhập kho đã được tạo thành công",
    "data": {
      "_id": "string", // ID của phiếu nhập
      "orderItems": [
         { "book": "string", "quantity": "number", "_id": "string" }
      ],
      "status": "pending", // Trạng thái ban đầu là pending
      "createdBy": "string", // ID người tạo (hiện đang giả lập)
      "createdAt": "string",
      "updatedAt": "string",
      "__v": "number"
    }
  }
  ```

#### 2.3. Xác nhận phiếu nhập kho
- **URL**: `/books/restock/confirm/:orderId`
- **Method**: `PUT`
- **Description**: Xác nhận một phiếu nhập kho đang ở trạng thái `pending`. Sau khi xác nhận, số lượng sách trong kho sẽ được cập nhật.
- **Parameters**: 
  - `orderId`: ID của phiếu nhập cần xác nhận (bắt buộc).
- **Body**: (Không cần body)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Phiếu nhập kho đã được xác nhận và số lượng sách đã được cập nhật",
    "data": { ... // Thông tin phiếu nhập sau khi xác nhận (status: 'confirmed') }
  }
  ```

#### 2.4. Tải PDF phiếu nhập kho
- **URL**: `/books/restock/:orderId/pdf`
- **Method**: `GET`
- **Description**: Tạo và tải về file PDF của một phiếu nhập kho đã xác nhận.
- **Parameters**: 
  - `orderId`: ID của phiếu nhập cần tạo PDF (bắt buộc).
- **Response**: File PDF (Content-Type: application/pdf)

## Error Responses

Tất cả các API đều có thể trả về lỗi với format:
```json
{
  "success": false,
  "message": "Mô tả lỗi chi tiết"
}
```

### Các mã trạng thái HTTP và lỗi phổ biến:
- `200 OK`: Yêu cầu thành công.
- `201 Created`: Yêu cầu tạo tài nguyên thành công.
- `400 Bad Request`: Yêu cầu không hợp lệ (ví dụ: thiếu/sai dữ liệu, ID sai format, dữ liệu trùng lặp).
- `404 Not Found`: Không tìm thấy tài nguyên được yêu cầu (ví dụ: không tìm thấy sách theo ID).
- `500 Internal Server Error`: Lỗi xảy ra ở phía server. 