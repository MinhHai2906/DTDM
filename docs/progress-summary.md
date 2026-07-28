# Tiến trình làm việc dự án ĐTĐM

## Mục tiêu hiện tại
Xây dựng ứng dụng web 3 tầng theo hướng dễ bảo trì, dễ mở rộng và có tầng backend rõ ràng.

## Những gì đang làm
1. Tạo frontend cho người dùng và quản trị.
2. Xây dựng backend API bằng Express.
3. Tách logic CRUD sản phẩm sang service layer.
4. Tạo route riêng cho API sản phẩm.
5. Thêm middleware ghi log và xử lý lỗi tập trung.
6. Chuẩn bị test tự động cho API CRUD.

## Cấu trúc đang hướng tới
- Frontend: giao diện người dùng và admin
- Backend: API, route, service, middleware
- Database: Firestore

## Backend đang triển khai những gì
### 1. Tầng presentation/backend API
File: backend/server.js
- Đây là điểm vào của hệ thống backend.
- Nhận request từ frontend.
- Cấu hình CORS, JSON parser và các middleware chung.
- Đăng ký các route như /api/products, /api/admin-login, /api/health.
- Đáp ứng yêu cầu: tách frontend khỏi logic nghiệp vụ, backend có thể nhận và xử lý request riêng.

### 2. Tầng route
File: backend/routes/products.js
- Chịu trách nhiệm tiếp nhận các request HTTP.
- Ví dụ: GET /api/products, POST /api/products, PUT /api/products/:id, DELETE /api/products/:id.
- Không chứa logic nghiệp vụ phức tạp, chỉ chuyển request tới service.
- Đáp ứng yêu cầu: backend có cấu trúc rõ ràng, dễ bảo trì và mở rộng.

### 3. Tầng service
File: backend/services/productService.js
- Chứa logic nghiệp vụ cho sản phẩm.
- Quản lý thao tác create, read, update, delete.
- Tách logic khỏi route, giúp code dễ test và dễ sửa.
- Đáp ứng yêu cầu: phân tầng rõ ràng, thay đổi nghiệp vụ không làm ảnh hưởng trực tiếp tới route.

### 4. Tầng middleware
Files:
- backend/middleware/requestLogger.js
- backend/middleware/errorHandler.js
- requestLogger: ghi log mỗi request để dễ giám sát.
- errorHandler: tập trung xử lý lỗi, trả về response thống nhất.
- Đáp ứng yêu cầu: tăng tính bảo mật, dễ debug và dễ theo dõi hệ thống.

### 5. Tầng data access
Hiện tại đang dùng Firebase Firestore thông qua Firebase Admin SDK.
- backend/firebase-admin.js cung cấp kết nối tới Firestore.
- ProductService gọi Firestore để đọc/ghi dữ liệu.
- Đáp ứng yêu cầu: backend có tầng lưu trữ riêng, tách khỏi frontend.

## Các file chính
- Frontend người dùng: frontend/User
- Frontend admin: frontend/ADMIN
- Backend server: backend/server.js
- API sản phẩm: backend/routes/products.js
- Service xử lý sản phẩm: backend/services/productService.js
- Middleware log: backend/middleware/requestLogger.js
- Middleware lỗi: backend/middleware/errorHandler.js
- Test API: backend/tests/products.test.js

## Vai trò của từng phần trong kiến trúc 3 tầng
- Frontend: hiển thị giao diện, gửi request tới backend
- Backend: xử lý nghiệp vụ và điều phối logic
- Database: lưu trữ dữ liệu trong Firestore

## Trạng thái hiện tại
- Frontend đã có.
- Backend đã có API cơ bản.
- CRUD sản phẩm đã được tách sang service layer.
- Middleware log và lỗi đã có.
- Test mẫu cho API đã được tạo.
- Còn cần tiếp tục mở rộng cho orders, users, reviews và kết nối frontend sang API thay vì gọi Firestore trực tiếp.

## Kế hoạch tiếp theo
- Hoàn thiện API cho orders, users, reviews.
- Chuyển frontend sang gọi API backend thay vì gọi Firestore trực tiếp.
- Thêm validation và auth middleware.
- Triển khai backend lên cloud và cấu hình môi trường riêng.
