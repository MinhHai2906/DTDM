// ========== KIỂM TRA ĐĂNG NHẬP ==========
function isLoggedIn() {
  const currentUser = localStorage.getItem("currentUser");
  return currentUser !== null;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

// ========== LẤY DỮ LIỆU TỪ LOCALSTORAGE ==========
function getCart() {
  if (!isLoggedIn()) return [];
  const cartData = localStorage.getItem("cart_" + getCurrentUser().id);
  return cartData ? JSON.parse(cartData) : [];
}

function saveCart(cart) {
  if (!isLoggedIn()) return;
  localStorage.setItem("cart_" + getCurrentUser().id, JSON.stringify(cart));
  updateCartCount();
  renderCartPage();
}

// Danh sách sản phẩm mẫu
const products = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: 29990000,
    image: "https://picsum.photos/id/1/200/200",
    category: "phone",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: 27990000,
    image: "https://picsum.photos/id/2/200/200",
    category: "phone",
  },
  {
    id: 3,
    name: 'iPad Pro 11"',
    price: 19990000,
    image: "https://picsum.photos/id/3/200/200",
    category: "tablet",
  },
  {
    id: 4,
    name: "MacBook Air M2",
    price: 28990000,
    image: "https://picsum.photos/id/4/200/200",
    category: "laptop",
  },
  {
    id: 5,
    name: "AirPods Pro 2",
    price: 4990000,
    image: "https://picsum.photos/id/5/200/200",
    category: "headphone",
  },
  {
    id: 6,
    name: "Apple Watch Series 9",
    price: 9990000,
    image: "https://picsum.photos/id/8/200/200",
    category: "watch",
  },
];

function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

function updateCartCount() {
  if (!isLoggedIn()) {
    const cartCountElem = document.getElementById("cartCount");
    if (cartCountElem) cartCountElem.innerText = "0";
    return;
  }
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCountElem = document.getElementById("cartCount");
  if (cartCountElem) cartCountElem.innerText = total;
}

function updateQuantity(productId, delta) {
  let cart = getCart();
  const itemIndex = cart.findIndex((i) => String(i.id) === String(productId));
  if (itemIndex !== -1) {
    const currentQty = Number(cart[itemIndex].quantity) || 1;
    const nextQty = currentQty + delta;
    cart[itemIndex].quantity = nextQty < 1 ? 1 : nextQty;
    saveCart(cart);
  }
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter((item) => String(item.id) !== String(productId));
  saveCart(cart);
}

let discountPercent = 0;

function applyVoucher() {
  const code = document.getElementById("voucherCode")?.value;
  if (code === "PHONE10") {
    discountPercent = 10;
    showModal("🎉 Áp dụng mã PHONE10 thành công! Giảm 10%", true);
  } else if (code === "SALE20") {
    discountPercent = 20;
    showModal("🎉 Áp dụng mã SALE20 thành công! Giảm 20%", true);
  } else if (code === "") {
    discountPercent = 0;
    showModal("Đã xóa mã giảm giá", true);
  } else {
    showModal("❌ Mã giảm giá không hợp lệ!", false);
  }
  renderCartPage();
}

function checkout() {
  const cart = getCart();
  if (cart.length === 0) {
    showModal("⚠️ Giỏ hàng của bạn đang trống!", false);
    return;
  }

  const subtotal = calculateSubtotal();
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const orderInfo = {
    items: cart,
    subtotal,
    discount: discountPercent,
    shipping,
    total: Math.max(
      0,
      subtotal - (subtotal * discountPercent) / 100 + shipping,
    ),
    timestamp: new Date().toISOString(),
    userId: getCurrentUser().id,
  };
  localStorage.setItem("checkoutOrder", JSON.stringify(orderInfo));
  window.location.href = "payment.html";
}

function calculateSubtotal() {
  const cart = getCart();
  let subtotal = 0;
  cart.forEach((item) => {
    const price = Number(item.price) || 0;
    subtotal += price * (item.quantity || 1);
  });
  return subtotal;
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

  setTimeout(() => {
    if (modal.parentNode) {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    }
  }, 2500);
}

function renderCartPage() {
  const container = document.getElementById("cartContainer");
  if (!container) return;

  // Kiểm tra đăng nhập
  if (!isLoggedIn()) {
    container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-user-lock"></i>
                <h3>Vui lòng đăng nhập</h3>
                <p>Bạn cần đăng nhập để xem giỏ hàng</p>
                <a href="signin.html" class="shop-now-btn">🔐 Đăng nhập ngay</a>
                <p style="margin-top: 15px;">Chưa có tài khoản? <a href="signup.html" style="color:#b7791f;">Đăng ký</a></p>
            </div>
        `;
    return;
  }

  const cart = getCart();
  const currentUser = getCurrentUser();

  // Hiển thị thông tin user
  const userInfoHtml = `
        <div style="background: #fff5e6; padding: 15px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <i class="fas fa-user-circle" style="font-size: 24px; color: #b7791f;"></i>
                <span style="font-weight: 600; margin-left: 10px;">${currentUser.name}</span>
                <span style="color: #666; margin-left: 10px; font-size: 13px;">${currentUser.email}</span>
            </div>
        </div>
    `;

  if (cart.length === 0) {
    container.innerHTML =
      userInfoHtml +
      `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng trống</h3>
                <p>Hãy thêm sản phẩm từ trang chủ</p>
                <a href="index.html" class="shop-now-btn">🛍️ Mua ngay</a>
            </div>
        `;
    return;
  }

  let subtotal = 0;
  let cartItemsHtml = "";

  cart.forEach((item) => {
    // Use properties stored in cart item (saved by main.js) as primary source
    const qty = item.quantity || 1;
    const price = Number(item.price) || 0;
    const total = price * qty;
    subtotal += total;

    const safeId = String(item.id);
    const imageSrc = item.image || "https://placehold.co/200x200?text=No+Image";
    const name = item.name || "Sản phẩm";

    cartItemsHtml += `
        <tr>
          <td>
            <div class="cart-product">
              <div class="cart-product-img"><img src="${imageSrc}" alt="${name}"></div>
              <div class="cart-product-info"><h4>${name}</h4></div>
            </div>
          </td>
          <td class="cart-price">${formatPrice(price)}</td>
          <td>
            <div class="cart-quantity">
              <button class="quantity-btn" onclick="updateQuantity('${safeId}', -1)">-</button>
            <span class="quantity-value">${qty}</span>
              <button class="quantity-btn" onclick="updateQuantity('${safeId}', 1)">+</button>
            </div>
          </td>
          <td class="cart-total-item">${formatPrice(total)}</td>
          <td><button class="cart-remove" onclick="removeFromCart('${safeId}')"><i class="fas fa-trash"></i></button></td>
        </tr>
      `;
  });

  if (!cartItemsHtml.trim()) {
    saveCart([]);
    container.innerHTML =
      userInfoHtml +
      `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng trống</h3>
                <p>Chưa có sản phẩm trong giỏ. Mời bạn mua sắm.</p>
                <a href="index.html" class="shop-now-btn">🛍️ Mua ngay</a>
            </div>
        `;
    return;
  }

  const discount = (subtotal * discountPercent) / 100;
  const shipping = subtotal > 500000 ? 0 : 30000;
  const finalTotal = subtotal - discount + shipping;

  const html =
    userInfoHtml +
    `
        <div class="cart-layout">
            <div class="cart-items-section">
                <table class="cart-table">
                    <thead>
                        <tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${cartItemsHtml}
                    </tbody>
                </table>
            </div>
            <div class="cart-summary">
                <h3>Đơn hàng</h3>
                <div class="summary-row"><span>Tạm tính:</span><span>${formatPrice(subtotal)}</span></div>
                <div class="summary-row"><span>Giảm giá:</span><span style="color:#ff4757">-${formatPrice(discount)}</span></div>
                <div class="summary-row"><span>Phí ship:</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
                <div class="voucher-input">
                    <input type="text" id="voucherCode" placeholder="Mã: PHONE10 hoặc SALE20">
                    <button onclick="applyVoucher()">Áp dụng</button>
                </div>
                <div class="summary-row total"><span>Tổng cộng:</span><span>${formatPrice(finalTotal)}</span></div>
                <button class="checkout-btn" onclick="checkout()">💳 Thanh toán ngay</button>
                <a href="index.html" class="continue-shopping">← Tiếp tục mua sắm</a>
            </div>
        </div>
    `;

  container.innerHTML = html;
}

function setupSearch() {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  if (searchBtn) {
    searchBtn.onclick = () => {
      const keyword = searchInput.value;
      if (keyword) localStorage.setItem("searchKeyword", keyword);
      window.location.href = "index.html";
    };
  }
}

// Chạy khi tải trang
document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
  updateCartCount();
  setupSearch();
});
