# 📱 Website Cửa Hàng Bán Điện Thoại PhoneStore (Ứng Dụng Web 3 Tầng Trên Cloud)

<div align="center">

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![Architecture](https://img.shields.io/badge/Architecture-3--Tier-orange)
![Cloud Provider](https://img.shields.io/badge/Cloud-Render%20%7C%20Firebase-informational)

**Đề tài môn học: Triển khai ứng dụng web 3 tầng trên Cloud**  
**Trường:** Đại học Giao thông Vận tải TP.HCM (UTH) | **GVHD:** Lê Quốc Tuấn | **Nhóm thực hiện:** Nhóm 3

</div>

---

## 📌 Giới Thiệu

PhoneStore là hệ thống website thương mại điện tử kinh doanh điện thoại di động được thiết kế và triển khai hoàn chỉnh theo kiến trúc Web 3 tầng (3-Tier Architecture) độc lập trên môi trường Điện toán đám mây. Hệ thống đáp ứng hai phân hệ người dùng chính: Khách hàng (User) và Quản trị viên (Admin).

---

## ✨ Tính Năng Cốt Lõi

### 🛍️ Phân Hệ Khách Hàng (User)
- **Tài khoản:** Đăng ký, đăng nhập xác thực an toàn.
- **Sản phẩm:** Duyệt sản phẩm, tìm kiếm, lọc theo thương hiệu/danh mục, xem chi tiết thông số kỹ thuật.
- **Mua hàng:** Quản lý giỏ hàng, cập nhật số lượng và đặt hàng.
- **Cá nhân & Đánh giá:** Xem lịch sử đơn hàng, gửi đánh giá/bình luận sản phẩm.

### 👨‍💼 Phân Hệ Quản Trị Viên (Admin)
- **Dashboard:** Thống kê tổng quan hệ thống.
- **Quản lý CRUD:** Thêm, xem, cập nhật, xóa sản phẩm và danh mục.
- **Quản lý đơn hàng:** Tiếp nhận, cập nhật trạng thái đơn hàng của khách hàng.
- **Quản lý người dùng & Đánh giá:** Quản lý tài khoản người dùng và kiểm duyệt bình luận/đánh giá.

---

## 🛠️ Công Nghệ & Kiến Trúc 3 Tầng

Hệ thống tuân thủ nguyên tắc phân tách trách nhiệm (Separation of Concerns) và giảm độ phụ thuộc (Loose Coupling):

| Tầng (Tier) | Công Nghệ Sử Dụng | Môi Trường Triển Khai (Cloud) | Vai Trò & Chức Năng |
| :--- | :--- | :--- | :--- |
| **Presentation Layer** | HTML5, CSS3, Vanilla JavaScript | **Render** (Static Site) | Hiển thị UI/UX, tương tác DOM, gửi HTTP Requests (JSON) qua REST API. |
| **Application Layer** | Node.js, Express.js | **Render** (Web Service qua Docker) | Xử lý logic nghiệp vụ, xác thực JWT/Token, kiểm tra dữ liệu, điều hướng API. |
| **Data Layer** | Cloud Firestore, Firebase Auth, Firebase Storage | **Firebase Cloud Platform** | Lưu trữ NoSQL tập trung (`users`, `products`, `orders`, `reviews`), quản lý Auth và tệp tin tĩnh. |

---

## 💻 Yêu Cầu Môi Trường

- **Node.js:** v16.x trở lên
- **Docker:** (Tùy chọn, dùng cho việc đóng gói backend)
- **Git:** Quản lý mã nguồn
- **Tài khoản Cloud:** Render & Google Firebase

---

## 📁 Cấu Trúc Dự Án

```text
Website-Store-Sells-Phones/
├── frontend/                     # Presentation Layer
│   ├── ADMIN/                    # Giao diện dành cho quản trị viên
│   │   ├── admin.html            # Dashboard
│   │   ├── products.html         # Quản lý sản phẩm
│   │   └── users.html            # Quản lý người dùng
│   ├── User/                     # Giao diện dành cho khách hàng
│   │   ├── index.html            # Trang chủ
│   │   ├── detail.html           # Chi tiết sản phẩm
│   │   ├── cart.html             # Giỏ hàng
│   │   └── payment.html          # Thanh toán
│   ├── css/                      # Stylesheet định kiểu giao diện
│   ├── js/                       # Mã nguồn JS xử lý gọi REST API
│   └── assets/                   # Hình ảnh tĩnh, banners, icons
│
└── backend/                      # Application Layer
    ├── middleware/               # CORS, Auth token, Data Validation
    ├── routes/                   # Routing các đường dẫn API (/api/products, /api/orders,...)
    ├── services/                 # Logic nghiệp vụ & tương tác Firebase SDK
    ├── tests/                    # Unit tests & Integration tests
    ├── Dockerfile                # File cấu hình đóng gói container
    ├── firebase-admin.js         # Khởi tạo kết nối Firebase Admin SDK
    └── server.js                 # Entry point chạy máy chủ Express
🚀 Cài Đặt & Chạy Cục Bộ (Local)
1. Clone Mã Nguồn
Bash
git clone [https://github.com/NhatQuenTen/Thuong-Mai-Dien-Tu.git](https://github.com/NhatQuenTen/Thuong-Mai-Dien-Tu.git)
cd Thuong-Mai-Dien-Tu
2. Thiết Lập Backend
Bash
cd backend
npm install
Tạo file .env tại thư mục backend/:

Đoạn mã
PORT=3000
CORS_ORIGIN=http://localhost:5500
FIREBASE_PROJECT_ID=your-firebase-project-id
Thêm file khóa cấu hình Firebase: backend/serviceAccountKey.json.

Khởi động Backend server:

Bash
npm start
# Server chạy tại http://localhost:3000 (Kiểm tra healthcheck tại /api/health)
3. Thiết Lập Frontend
Mở thư mục frontend/ bằng Live Server (hoặc mở trực tiếp file frontend/User/index.html trên trình duyệt).

☁️ Quy Trình Triển Khai Lên Cloud (Deployment Flow)
Hệ thống được triển khai tự động hóa thông qua các bước:

Push Code: Đẩy mã nguồn hoàn thiện lên GitHub Repository.

Build & Deploy Frontend: Kết nối GitHub với Render để tự động hóa build và host dưới dạng Static Site.

Deploy Backend (Docker): Đóng gói ứng dụng Node.js/Express bằng Dockerfile và triển khai dạng Web Service trên Render.

Configure Firebase: Cấu hình Cloud Firestore DB, Firebase Auth và Firebase Storage.

Configure API & CORS: Cấu hình HTTPS REST API, biến môi trường (PORT, CORS_ORIGIN, kết nối Firebase Admin SDK).

Testing & Monitoring: Kiểm thử các API Endpoint qua Postman/Jest và giám sát trạng thái hệ thống.

Plaintext
[Người dùng Browser] ──HTTPS/REST API──> [Render Static Frontend]
                                                  │
                                                  ▼
[Firebase Services (Firestore/Auth)] <──SDK── [Render Backend Node.js/Express (Docker)]
🔒 Bảo Mật Hệ Thống
HTTPS Encryption: Mã hóa toàn bộ dữ liệu truyền tải qua đường truyền.

CORS Management: Giới hạn tên miền frontend được phép gọi request đến API backend.

Role-based Access Control (RBAC): Phân quyền truy cập nghiêm ngặt giữa khách hàng và Admin.

Environment Variables: Bảo mật thông tin khóa bí mật (Secret Keys, Service Account Keys) bằng biến môi trường .env.

Firebase Security Rules: Thiết lập quy tắc kiểm soát quyền đọc/ghi dữ liệu ở tầng cơ sở dữ liệu.

🗓️ Đánh Giá & Hướng Phát Triển
Hạn chế hiện tại
Phân trang API chưa tối ưu triệt để cho tập dữ liệu cực lớn.

Cần tăng cường cơ chế monitoring tự động và hệ thống backup định kỳ cho cơ sở dữ liệu.

Định hướng tương lai
Bổ sung thanh toán trực tuyến qua cổng thanh toán VNPay/Momo.

Tối ưu Caching (Redis) và Lazy Loading hình ảnh để cải thiện tốc độ tải.

Mở rộng kiến trúc Backend hỗ trợ Load Balancing khi lưu lượng tăng cao.

📄 License & Thông Tin
MIT License © 2026 PhoneStore Project - UTH
