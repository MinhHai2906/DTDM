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
