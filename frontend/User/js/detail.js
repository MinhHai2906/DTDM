import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDk1XTVn68McS02jMIXnyQ3bqtpLF3L1XQ",
  authDomain: "web-dienthoai0-dtdm.firebaseapp.com",
  projectId: "web-dienthoai0-dtdm",
  storageBucket: "web-dienthoai0-dtdm.firebasestorage.app",
  messagingSenderId: "102142538462",
  appId: "1:102142538462:web:8c2c6c4637a54304ef484f",
};

const CATEGORY_NAME_MAP = {
  phone: "Điện thoại",
  headphone: "Tai nghe",
  charger: "Sạc",
  tablet: "Máy tính bảng",
  laptop: "Laptop",
  watch: "Đồng hồ thông minh",
  speaker: "Loa",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let products = [];
let currentProduct = null;
let currentReviews = [];
let currentStarFilter = 0;
let selectedSubmitStar = 5;
let firebaseUser = null;

// Theo dõi trạng thái đăng nhập từ Firebase SDK
onAuthStateChanged(auth, (user) => {
  firebaseUser = user;
  if (user) {
    console.log("Firebase Auth: Đã xác thực người dùng", user.uid);
  } else {
    console.log("Firebase Auth: Chưa đăng nhập hoặc đang load...");
  }
});

function renderStarsHTML(rating, size = "16px") {
  let html = "";
  const fullStars = Math.floor(rating);
  const hasHalfStart = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStart ? 1 : 0);

  for (let i = 0; i < fullStars; i++)
    html += `<i class="fas fa-star" style="font-size:${size}"></i>`;
  if (hasHalfStart)
    html += `<i class="fas fa-star-half-alt" style="font-size:${size}"></i>`;
  for (let i = 0; i < emptyStars; i++)
    html += `<i class="far fa-star" style="font-size:${size}"></i>`;
  return html;
}

function renderReviews() {
  const summaryContainer = document.getElementById("reviewsSummary");
  const listContainer = document.getElementById("reviewsList");
  if (!summaryContainer || !listContainer) return;

  if (currentReviews.length === 0) {
    summaryContainer.innerHTML =
      '<div style="text-align:center; padding: 20px; width:100%; color:#666;">Chưa có đánh giá nào cho sản phẩm này.</div>';
    listContainer.innerHTML = "";
    return;
  }

  const total = currentReviews.length;
  const avg = (
    currentReviews.reduce((sum, r) => sum + Number(r.star), 0) / total
  ).toFixed(1);

  let stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, img: 0 };
  currentReviews.forEach((r) => {
    if (stats[r.star] !== undefined) stats[r.star]++;
    if (r.images && r.images.length > 0) stats.img++;
  });

  summaryContainer.innerHTML = `
        <div class="rating-overall">
            <h3>${avg}<span class="out-of">/5</span></h3>
            <div class="stars" style="color: #ffc107;">
                ${renderStarsHTML(avg, "20px")}
            </div>
            <p>${total} đánh giá</p>
        </div>
        
        <div class="rating-filter">
            <button class="${currentStarFilter === 0 ? "active" : ""}" onclick="window.filterReviews(0)">Tất cả (${total})</button>
            <button class="${currentStarFilter === 5 ? "active" : ""}" onclick="window.filterReviews(5)">5 Sao (${stats[5] || 0})</button>
            <button class="${currentStarFilter === 4 ? "active" : ""}" onclick="window.filterReviews(4)">4 Sao (${stats[4] || 0})</button>
            <button class="${currentStarFilter === 3 ? "active" : ""}" onclick="window.filterReviews(3)">3 Sao (${stats[3] || 0})</button>
            <button class="${currentStarFilter === 2 ? "active" : ""}" onclick="window.filterReviews(2)">2 Sao (${stats[2] || 0})</button>
            <button class="${currentStarFilter === 1 ? "active" : ""}" onclick="window.filterReviews(1)">1 Sao (${stats[1] || 0})</button>
        </div>
    `;

  const filteredReviews =
    currentStarFilter === 0
      ? currentReviews
      : currentReviews.filter((r) => r.star === currentStarFilter);

  if (filteredReviews.length === 0) {
    listContainer.innerHTML =
      '<div style="text-align:center; padding: 20px; color:#666;">Không có đánh giá phù hợp.</div>';
    return;
  }

  listContainer.innerHTML = filteredReviews
    .map((r) => {
      const initials = r.customer
        ? r.customer
            .trim()
            .split(" ")
            .map((w) => w[0])
            .slice(-2)
            .join("")
            .toUpperCase()
        : "AA";
      const dateStr = r.date ? r.date.split("-").reverse().join("/") : "";
      const imagesHtml =
        r.images && r.images.length > 0
          ? `<div class="review-images">
                ${r.images.map((img) => `<img src="${img}" alt="Review Image">`).join("")}
            </div>`
          : "";

      return `
        <div class="review-item" style="padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 20px;">
            <div class="user-info" style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                <div class="avatar" style="background: linear-gradient(135deg, #d4a373, #b7791f); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; width: 40px; height: 40px;">${initials}</div>
                <div class="user-details">
                    <div class="name" style="font-weight: 600; color: #2c1810; margin-bottom: 2px;">${r.customer || "Khách hàng"}</div>
                    <div class="stars small-stars" style="color: #ffc107; font-size: 12px;">
                        ${renderStarsHTML(r.star, "12px")}
                    </div>
                </div>
            </div>
            <div class="review-content">
                <p style="color: #495057; line-height: 1.6; margin-bottom: 10px;">${r.content || ""}</p>
                ${imagesHtml}
                <div class="review-date" style="font-size: 13px; color: #868e96; margin-bottom: 10px;">
                    ${dateStr} ${r.verified ? ' | <i class="fas fa-check-circle" style="color: #28a745;"></i> Đã mua hàng' : ""}
                </div>
            </div>
            ${
              r.reply
                ? `<div style="background: #fff9f0; padding: 12px; border-radius: 8px; margin-top: 10px; border-left: 3px solid #b7791f; font-size: 14px;">
                <div style="font-weight: 600; margin-bottom: 5px; color: #c17c2f;"><i class="fas fa-store"></i> Phản hồi từ cửa hàng:</div>
                <div style="color: #495057;">${r.reply}</div>
            </div>`
                : ""
            }
            <div class="review-actions" style="margin-top:10px;">
                <button style="background:none;border:none;color:#666;cursor:pointer;font-size:14px;"><i class="far fa-thumbs-up"></i> Hữu ích ${r.helpful ? `(${r.helpful})` : ""}</button>
            </div>
        </div>`;
    })
    .join("");
}

window.filterReviews = function (star) {
  currentStarFilter = star;
  renderReviews();
};

function setupReviewForm() {
  const btnToggle = document.getElementById("btnToggleReviewForm");
  const container = document.getElementById("reviewFormContainer");
  const stars = document.querySelectorAll("#starSelector i");
  const btnSubmit = document.getElementById("btnSubmitReview");
  const nameInput = document.getElementById("reviewName");

  if (btnToggle) {
    btnToggle.addEventListener("click", () => {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "null",
      );
      if (!currentUser) {
        showModal("Vui lòng đăng nhập để thực hiện đánh giá!", false);
        setTimeout(() => {
          localStorage.setItem("redirectAfterLogin", window.location.href);
          window.location.href = "signin.html";
        }, 1500);
        return;
      }

      // Điền tên người dùng đã đăng nhập và khóa input
      if (nameInput) {
        nameInput.value = currentUser.name || currentUser.displayName || "";
        nameInput.readOnly = true;
        nameInput.style.background = "#f1f3f5";
        nameInput.style.color = "#495057";
      }

      container.style.display =
        container.style.display === "none" ? "block" : "none";
    });
  }

  if (stars) {
    stars.forEach((star) => {
      star.addEventListener("click", (e) => {
        const val = parseInt(e.target.dataset.val);
        selectedSubmitStar = val;
        stars.forEach((s) => {
          if (parseInt(s.dataset.val) <= val) {
            s.classList.remove("far");
            s.classList.add("fas");
          } else {
            s.classList.remove("fas");
            s.classList.add("far");
          }
        });
      });
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener("click", async () => {
      if (!currentProduct) return;
      const name = document.getElementById("reviewName").value.trim();
      const content = document.getElementById("reviewContent").value.trim();
      if (!name || !content) {
        showModal("Vui lòng nhập đầy đủ tên và nội dung đánh giá!", false);
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = "Đang gửi...";

      try {
        // Ưu tiên lấy UID trực tiếp từ Firebase Auth SDK để khớp với Rules
        const uid = firebaseUser
          ? firebaseUser.uid
          : auth.currentUser
            ? auth.currentUser.uid
            : null;

        if (!uid) {
          showModal(
            "Hệ thống chưa xác thực được tài khoản của bạn. Vui lòng đợi trong giây lát hoặc thử đăng nhập lại.",
            false,
          );
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Gửi Đánh Giá";
          return;
        }

        await addDoc(collection(db, "reviews"), {
          userId: uid,
          customer: name,
          product: currentProduct.name,
          content: content,
          star: selectedSubmitStar,
          status: "approved",
          date: new Date().toISOString().split("T")[0],
          verified: false,
          reply: "", // Đồng bộ cấu trúc với bên Admin
        });
        showModal("Gửi đánh giá thành công! Cảm ơn bạn đã chia sẻ.", true);

        // Reset form nhưng giữ lại tên nếu vẫn login
        document.getElementById("reviewContent").value = "";
        container.style.display = "none";
        selectedSubmitStar = 5;
        stars.forEach((s) => {
          s.classList.remove("far");
          s.classList.add("fas");
        });
      } catch (err) {
        console.error("Lỗi chi tiết từ Firebase:", err);
        showModal("Lỗi Firebase: " + (err.message || "Gửi thất bại"), false);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Gửi Đánh Giá";
      }
    });
  }
}

function subscribeProductReviews(productName) {
  if (!productName) return;
  const q = query(
    collection(db, "reviews"),
    where("product", "==", productName),
    where("status", "in", ["approved", "replied"]),
  );

  onSnapshot(
    q,
    (snapshot) => {
      currentReviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      currentReviews.sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0),
      );
      renderReviews();
    },
    (error) => {
      console.error("Lỗi khi tải bình luận:", error);
    },
  );
}

function getProductLookupFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    productId: params.get("id"),
    productName: params.get("name"),
  };
}

function resolveImageUrl(imagePath) {
  if (!imagePath) return "https://placehold.co/400x400?text=No+Image";

  const normalizedPath = String(imagePath).replace(/\\/g, "/").trim();

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("./") || normalizedPath.startsWith("../")) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("assets/images/")) {
    return normalizedPath;
  }

  return `assets/images/${normalizedPath.split("/").pop()}`;
}

function getProductCreatedAtValue(data) {
  const createdAtMs = Number(data?.createdAtMs) || 0;
  const createdAt =
    typeof data?.createdAt?.toMillis === "function"
      ? data.createdAt.toMillis()
      : 0;

  return Math.max(createdAtMs, createdAt);
}

function getOldPrice(price, oldPrice, discount) {
  const normalizedOldPrice = Number(oldPrice) || 0;
  if (normalizedOldPrice > 0) return normalizedOldPrice;

  const normalizedPrice = Number(price) || 0;
  const normalizedDiscount = Number(discount) || 0;
  if (!normalizedPrice || normalizedDiscount <= 0 || normalizedDiscount >= 100)
    return 0;

  return Math.round(normalizedPrice / (1 - normalizedDiscount / 100));
}

function mapProduct(doc) {
  const data = doc.data() || {};
  const price = Number(data.price) || 0;
  const discount = Number(data.discount) || 0;

  return {
    id: doc.id,
    name: data.name || "Sản phẩm chưa có tên",
    brand: data.brand || "",
    category: data.category || "phone",
    categoryName:
      data.categoryName ||
      CATEGORY_NAME_MAP[data.category] ||
      data.category ||
      "Sản phẩm",
    price,
    oldPrice: getOldPrice(price, data.oldPrice, discount),
    discount,
    image: resolveImageUrl(data.image),
    desc: data.desc || "Sản phẩm đang được cập nhật mô tả.",
    specs: data.specs && typeof data.specs === "object" ? data.specs : {},
    rating: Number(data.rating) || 4.5,
    reviewCount: Number(data.reviewCount) || 0,
    createdAt: getProductCreatedAtValue(data),
  };
}

function showModal(message, isSuccess = true) {
  const oldModal = document.querySelector(".custom-modal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.className = "custom-modal";
  modal.innerHTML = `
        <div class="custom-modal-content ${isSuccess ? "success" : "error"}">
            <i class="fas ${isSuccess ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
            <p>${message}</p>
            <button class="modal-close-btn">Đóng</button>
        </div>
    `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add("show"), 10);

  modal.querySelector(".modal-close-btn").onclick = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
  };
}

function getCartStorageKey() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  return currentUser?.id ? `cart_${currentUser.id}` : "cart";
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem(getCartStorageKey()) || "[]");
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCountElem = document.getElementById("cartCount");
  if (cartCountElem) cartCountElem.innerText = total;
}

function getQuantity() {
  const quantityElem = document.getElementById("quantityValue");
  return quantityElem ? parseInt(quantityElem.innerText, 10) : 1;
}

function decreaseQuantity() {
  const quantityElem = document.getElementById("quantityValue");
  if (!quantityElem) return;

  const value = parseInt(quantityElem.innerText, 10) || 1;
  if (value > 1) quantityElem.innerText = value - 1;
}

function increaseQuantity() {
  const quantityElem = document.getElementById("quantityValue");
  if (!quantityElem) return;

  const value = parseInt(quantityElem.innerText, 10) || 1;
  quantityElem.innerText = value + 1;
}

function addToCart(productId, quantity = 1) {
  const product = products.find(
    (item) => String(item.id) === String(productId),
  );
  if (!product) return;

  const cart = JSON.parse(localStorage.getItem(getCartStorageKey()) || "[]");
  const existingIndex = cart.findIndex(
    (item) => String(item.id) === String(productId),
  );
  const currentPrice = Number(product.price) || 0;

  if (existingIndex !== -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: currentPrice,
      originalPrice: Number(product.oldPrice) || 0,
      discount: Number(product.discount) || 0,
      image: product.image,
      quantity,
    });
  }

  localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
  updateCartCount();
  showModal(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`, true);
}

function buyNow(productId, quantity) {
  addToCart(productId, quantity);
  setTimeout(() => {
    window.location.href = "cart.html";
  }, 900);
}

function formatPrice(price) {
  return `${(Number(price) || 0).toLocaleString("vi-VN")}₫`;
}

function renderRelatedProducts(product) {
  const related = [...products]
    .filter((item) => item.brand === product.brand && item.id !== product.id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 4);

  const container = document.getElementById("related-products");
  if (!container) return;

  if (related.length === 0) {
    container.innerHTML =
      '<p style="text-align:center; padding:40px;">Không có sản phẩm liên quan</p>';
    return;
  }

  container.innerHTML = related
    .map(
      (item) => `
        <div class="related-card" onclick="location.href='detail.html?id=${encodeURIComponent(item.id)}'">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
            <div class="related-card-info">
                <h4>${item.name}</h4>
                <div class="price">${formatPrice(item.price)}</div>
            </div>
        </div>
    `,
    )
    .join("");
}

function renderProductDetail(product) {
  currentProduct = product;
  const container = document.getElementById("productDetail");
  if (!container) return;

  document.getElementById("breadcrumb-category").textContent =
    product.categoryName;
  document.getElementById("breadcrumb-name").textContent = product.name;
  document.title = `${product.name} - PhoneStore`;

  const originalPrice = Number(product.oldPrice) || 0;
  const currentPrice = Number(product.price) || 0;
  const discountPercent = Number(product.discount) || 0;
  const savedAmount =
    discountPercent > 0 ? Math.round(originalPrice - currentPrice) : 0;
  const specsEntries = Object.entries(product.specs || {});
  const specsHtml = specsEntries.length
    ? specsEntries
        .map(
          ([key, value]) =>
            `<li><span class="spec-label">${key}:</span><span class="spec-value">${value}</span></li>`,
        )
        .join("")
    : '<li><span class="spec-value">Đang cập nhật thông số kỹ thuật</span></li>';

  const fullStars = Math.max(0, Math.min(5, Math.floor(product.rating)));
  const emptyStars = 5 - fullStars;
  const starsHtml = "★".repeat(fullStars) + "☆".repeat(emptyStars);

  container.innerHTML = `
        <div class="detail-layout">
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/500x500?text=No+Image'">
                </div>
            </div>
            <div class="product-info-detail">
                <h1>${product.name}</h1>
                <div class="product-rating">
                    <div class="stars">${starsHtml}</div>
                    <span class="review-count">(${product.reviewCount} đánh giá)</span>
                </div>
                <div class="price-box">
                    <span class="current-price">${formatPrice(currentPrice)}</span>
                    ${originalPrice > 0 ? `<span class="old-price">${formatPrice(originalPrice)}</span>` : ""}
                    ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ""}
                </div>
                ${discountPercent > 0 && savedAmount > 0 ? `<div class="product-savings">Tiết kiệm ${formatPrice(savedAmount)}</div>` : ""}
                <div class="product-description">
                    <h3>Mô tả sản phẩm</h3>
                    <p>${product.desc}</p>
                </div>
                <div class="product-description">
                    <h3>Thông số kỹ thuật</h3>
                    <ul class="specs-list">
                        ${specsHtml}
                    </ul>
                </div>
                <div class="quantity-selector">
                    <label>Số lượng:</label>
                    <div class="quantity-control">
                        <button onclick="decreaseQuantity()">-</button>
                        <span id="quantityValue">1</span>
                        <button onclick="increaseQuantity()">+</button>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn-add-cart" onclick="addToCart('${product.id}', getQuantity())">
                        <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                    </button>
                    <button class="btn-buy-now" onclick="buyNow('${product.id}', getQuantity())">
                        <i class="fas fa-bolt"></i> Mua ngay
                    </button>
                </div>
            </div>
        </div>
    `;

  renderRelatedProducts(product);
  subscribeProductReviews(product.name);
}

function renderNotFound() {
  const container = document.getElementById("productDetail");
  if (!container) return;

  document.getElementById("breadcrumb-category").textContent = "Không tìm thấy";
  document.getElementById("breadcrumb-name").textContent =
    "Không tìm thấy sản phẩm";

  container.innerHTML = `
        <div style="text-align:center; padding:80px 20px; background:white; border-radius:20px;">
            <i class="fas fa-exclamation-triangle" style="font-size:60px; color:#ff4757;"></i>
            <h2 style="margin:20px 0; color:#2c1810;">Không tìm thấy sản phẩm!</h2>
            <p style="margin-bottom:30px; color:#666;">Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <a href="index.html" style="background:linear-gradient(45deg,#d4a373,#b7791f); color:white; padding:12px 30px; border-radius:40px; text-decoration:none;">Quay lại trang chủ</a>
        </div>
    `;

  const related = document.getElementById("related-products");
  if (related) related.innerHTML = "";
}

function setupSearch() {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const keyword = searchInput.value.trim();
      if (!keyword) return;
      localStorage.setItem("searchKeyword", keyword);
      window.location.href = "index.html";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keyup", (event) => {
      if (event.key !== "Enter") return;
      const keyword = event.target.value.trim();
      if (!keyword) return;
      localStorage.setItem("searchKeyword", keyword);
      window.location.href = "index.html";
    });
  }
}

function subscribeProducts() {
  const { productId, productName } = getProductLookupFromUrl();

  onSnapshot(
    collection(db, "products"),
    (snapshot) => {
      products = snapshot.docs.map(mapProduct);
      let product = products.find(
        (item) => String(item.id) === String(productId),
      );

      if (!product && productName) {
        const normalizedName = String(productName).trim().toLowerCase();
        product = products.find(
          (item) =>
            String(item.name || "")
              .trim()
              .toLowerCase() === normalizedName,
        );
      }

      if (!product) {
        renderNotFound();
        return;
      }

      renderProductDetail(product);
    },
    (error) => {
      console.error("Không thể đọc sản phẩm từ Firebase:", error);
      renderNotFound();
    },
  );
}

document.addEventListener("DOMContentLoaded", () => {
  subscribeProducts();
  updateCartCount();
  setupSearch();
  setupReviewForm();
});

window.addToCart = addToCart;
window.buyNow = buyNow;
window.decreaseQuantity = decreaseQuantity;
window.increaseQuantity = increaseQuantity;
window.getQuantity = getQuantity;
