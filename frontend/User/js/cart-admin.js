"use strict";

const ADMIN_PRODUCTS_KEY = "mobistore_products";
const FALLBACK_PRODUCTS =
  typeof products !== "undefined" && Array.isArray(products) ? products : [];

let PROMO_CODES = [];
let selectedCartIds = new Set();
let hasSelectionInitialized = false;

function isLoggedIn() {
  return localStorage.getItem("currentUser") !== null;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getCartKey() {
  const user = getCurrentUser();
  return user ? `cart_${user.id}` : "cart";
}

function parseCart(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLegacyCartKey() {
  return "cart";
}

function migrateLegacyCartIfNeeded() {
  if (!isLoggedIn()) return;

  const currentKey = getCartKey();
  // If user-scoped cart key already exists (even as []), respect it and stop migrating.
  if (localStorage.getItem(currentKey) !== null) return;

  const currentCart = parseCart(localStorage.getItem(currentKey));
  if (currentCart.length > 0) return;

  const legacyRaw = localStorage.getItem(getLegacyCartKey());
  if (!legacyRaw) return;

  try {
    const legacyParsed = JSON.parse(legacyRaw);
    const legacyCart = Array.isArray(legacyParsed) ? legacyParsed : [];
    if (legacyCart.length > 0) {
      localStorage.setItem(currentKey, JSON.stringify(legacyCart));
      return;
    }
  } catch {
    // ignore invalid legacy data
  }

  const fallbackCarts = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith("cart_") || key === currentKey) continue;

    const fallbackCart = parseCart(localStorage.getItem(key));
    if (fallbackCart.length > 0) {
      fallbackCarts.push(fallbackCart);
    }
  }

  if (fallbackCarts.length === 1) {
    localStorage.setItem(currentKey, JSON.stringify(fallbackCarts[0]));
  }
}

function getCart() {
  if (!isLoggedIn()) return [];

  migrateLegacyCartIfNeeded();
  return parseCart(localStorage.getItem(getCartKey()));
}

function saveCart(cart) {
  if (!isLoggedIn()) return;
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  updateCartCount();
  renderCartPage();
  window.dispatchEvent(new Event("cartUpdated"));
}

function getCatalog() {
  const stored = localStorage.getItem(ADMIN_PRODUCTS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((product) => ({
          id: String(product.id),
          name: product.name || "Sản phẩm",
          price: Number(product.price) || 0,
          image: product.image || "",
          category: product.category || "",
          brand: product.brand || "",
          originalPrice: Number(product.originalPrice || product.oldPrice) || 0,
          discount: Number(product.discount) || 0,
        }));
      }
    } catch {
      // fall through
    }
  }

  return FALLBACK_PRODUCTS.map((product) => ({
    id: String(product.id),
    name: product.name || "Sản phẩm",
    price: Number(product.price) || 0,
    image: product.image || "",
    category: product.category || "",
    brand: product.brand || "",
    originalPrice: Number(product.originalPrice || product.oldPrice) || 0,
    discount: Number(product.discount) || 0,
  }));
}

function findCatalogProduct(item) {
  const catalog = getCatalog();
  return catalog.find((product) => String(product.id) === String(item.id));
}

function resolveCartItem(item) {
  const catalogProduct = findCatalogProduct(item);
  const name = item.name || catalogProduct?.name || "Sản phẩm";
  const price = Number(item.price || catalogProduct?.price) || 0;
  const originalPrice =
    Number(item.originalPrice || catalogProduct?.originalPrice || 0) || 0;
  const image =
    item.image ||
    catalogProduct?.image ||
    "https://placehold.co/300x200?text=No+Image";
  const brand = item.brand || catalogProduct?.brand || "";
  const category = item.category || catalogProduct?.category || "";

  return {
    ...item,
    name,
    price,
    originalPrice,
    image,
    brand,
    category,
  };
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString("vi-VN")}đ`;
}

function updateCartCount() {
  if (!isLoggedIn()) {
    const cartCountElems = document.querySelectorAll("#cartCount, .cart-count");
    cartCountElems.forEach((el) => {
      el.innerText = "0";
    });
    return;
  }

  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCountElems = document.querySelectorAll("#cartCount, .cart-count");
  cartCountElems.forEach((el) => {
    el.innerText = String(total);
  });
}

function updateQuantity(productId, delta) {
  const cart = getCart();
  const itemIndex = cart.findIndex(
    (item) => String(item.id) === String(productId),
  );
  if (itemIndex === -1) return;

  const nextQty = (cart[itemIndex].quantity || 1) + delta;
  cart[itemIndex].quantity = nextQty < 1 ? 1 : nextQty;

  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter(
    (item) => String(item.id) !== String(productId),
  );
  saveCart(cart);
}

function getSortedCartItems(cart) {
  return [...cart]
    .map((item, index) => ({ ...item, _idx: index }))
    .sort((a, b) => {
      const aTime = Number(a.addedAt) || 0;
      const bTime = Number(b.addedAt) || 0;
      if (aTime !== bTime) return bTime - aTime;
      return b._idx - a._idx;
    })
    .map(({ _idx, ...item }) => item);
}

function syncSelectedCartIds(cartItems) {
  const validIds = new Set(cartItems.map((item) => String(item.id)));
  const nextSelected = new Set();

  selectedCartIds.forEach((id) => {
    if (validIds.has(id)) nextSelected.add(id);
  });

  if (
    !hasSelectionInitialized &&
    nextSelected.size === 0 &&
    cartItems.length > 0
  ) {
    // Check if user came from buyNow - only select that product
    const buyNowProductId = localStorage.getItem("buyNowProductId");
    if (buyNowProductId && validIds.has(buyNowProductId)) {
      nextSelected.add(buyNowProductId);
      localStorage.removeItem("buyNowProductId");
    } else {
      // Otherwise select all products
      cartItems.forEach((item) => nextSelected.add(String(item.id)));
    }
    hasSelectionInitialized = true;
  }

  selectedCartIds = nextSelected;
}

function getSelectedCartItems(cartItems) {
  syncSelectedCartIds(cartItems);
  return cartItems.filter((item) => selectedCartIds.has(String(item.id)));
}

function toggleCartItemSelection(productId, checked) {
  const id = String(productId);
  hasSelectionInitialized = true;
  if (checked) selectedCartIds.add(id);
  else selectedCartIds.delete(id);
  renderCartPage();
}

function toggleSelectAllCart(checked) {
  const cartItems = getSortedCartItems(getCart());
  hasSelectionInitialized = true;
  if (checked) {
    cartItems.forEach((item) => selectedCartIds.add(String(item.id)));
  } else {
    selectedCartIds.clear();
  }
  renderCartPage();
}

window.toggleCartItemSelection = toggleCartItemSelection;
window.toggleSelectAllCart = toggleSelectAllCart;

let appliedPromoCode = "";

function getDefaultPromoCodes() {
  return [
    {
      id: "ALL5A",
      code: "ALL5A",
      title: "Giảm 5%",
      percent: 5,
      desc: "Áp dụng mọi sản phẩm",
      status: "active",
    },
    {
      id: "ALL5B",
      code: "ALL5B",
      title: "Giảm 5%",
      percent: 5,
      desc: "Áp dụng mọi sản phẩm",
      status: "active",
    },
    {
      id: "ALL10A",
      code: "ALL10A",
      title: "Giảm 10%",
      percent: 10,
      desc: "Áp dụng mọi sản phẩm",
      status: "active",
    },
    {
      id: "ALL10B",
      code: "ALL10B",
      title: "Giảm 10%",
      percent: 10,
      desc: "Áp dụng mọi sản phẩm",
      status: "active",
    },
    {
      id: "ALL15A",
      code: "ALL15A",
      title: "Giảm 15%",
      percent: 15,
      desc: "Áp dụng mọi sản phẩm",
      status: "active",
    },
  ];
}

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function getPromoCalculation(cart, promoCode) {
  const normalizedCode = normalizeCode(promoCode);
  const promo = PROMO_CODES.find(
    (item) => String(item.code).toUpperCase() === normalizedCode,
  );

  if (!promo) {
    return {
      code: "",
      rule: null,
      eligibleSubtotal: 0,
      discountAmount: 0,
      hasEligibleItem: false,
    };
  }

  let eligibleSubtotal = 0;
  let hasEligibleItem = false;
  const totalQuantity = cart.reduce(
    (sum, cartItem) => sum + (cartItem.quantity || 1),
    0,
  );

  if (totalQuantity !== 1 || cart.length !== 1) {
    return {
      code: normalizedCode,
      rule: promo,
      eligibleSubtotal: 0,
      discountAmount: 0,
      hasEligibleItem: false,
      blockedByMultiItems: true,
    };
  }

  const item = resolveCartItem(cart[0]);
  eligibleSubtotal = (Number(item.price) || 0) * (cart[0].quantity || 1);
  hasEligibleItem = Number(promo.percent) > 0;

  const discountAmount = hasEligibleItem
    ? Math.round((eligibleSubtotal * Number(promo.percent)) / 100)
    : 0;

  return {
    code: normalizedCode,
    rule: promo,
    eligibleSubtotal,
    discountAmount,
    hasEligibleItem,
    blockedByMultiItems: false,
  };
}

function getStoredCopiedPromoCode() {
  return normalizeCode(localStorage.getItem("copiedPromoCode") || "");
}

function getRedeemedPromoCodes() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("redeemedPromoCodes") || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRedeemedPromoCodes(codes) {
  localStorage.setItem("redeemedPromoCodes", JSON.stringify(codes));
}

function syncVoucherInputWithAppliedCode() {
  const input = document.getElementById("voucherCode");
  if (!input) return;
  input.value = appliedPromoCode || "";
}

function applyVoucherFromCode(rawCode, showFeedback = true) {
  const code = normalizeCode(rawCode);

  if (!code) {
    appliedPromoCode = "";
    if (showFeedback) showModal("Đã xóa mã giảm giá", true);
    renderCartPage();
    return;
  }

  const promo = PROMO_CODES.find(
    (item) => String(item.code).toUpperCase() === code,
  );
  if (!promo) {
    if (showFeedback) showModal("❌ Mã giảm giá không hợp lệ!", false);
    return;
  }

  const redeemedCodes = getRedeemedPromoCodes();
  if (redeemedCodes.includes(code)) {
    appliedPromoCode = "";
    if (showFeedback)
      showModal(
        `Mã ${code} đã được sử dụng 1 lần trước đó. Mỗi mã chỉ áp dụng 1 lần.`,
        false,
      );
    renderCartPage();
    return;
  }

  const calculation = getPromoCalculation(
    getSelectedCartItems(getSortedCartItems(getCart())),
    code,
  );
  if (calculation.blockedByMultiItems) {
    appliedPromoCode = "";
    if (showFeedback)
      showModal("Mã chỉ áp dụng với 1 sản phẩm duy nhất", false);
    renderCartPage();
    return;
  }

  if (!calculation.hasEligibleItem) {
    appliedPromoCode = "";
    if (showFeedback)
      showModal(
        `❌ Mã ${code} không áp dụng cho sản phẩm hiện có trong giỏ.`,
        false,
      );
    renderCartPage();
    return;
  }

  appliedPromoCode = code;
  redeemedCodes.push(code);
  saveRedeemedPromoCodes(redeemedCodes);
  if (showFeedback) {
    showModal(
      `🎉 Áp dụng mã ${code} thành công! ${promo.desc || "Áp dụng mọi sản phẩm"}.`,
      true,
    );
  }
  renderCartPage();
}

function applyVoucher() {
  const code = document.getElementById("voucherCode")?.value;
  applyVoucherFromCode(code, true);
}

function calculateSubtotal() {
  const cartItems = getSelectedCartItems(getSortedCartItems(getCart()));
  return cartItems.reduce((sum, item) => {
    const resolved = resolveCartItem(item);
    return sum + (Number(resolved.price) || 0) * (item.quantity || 1);
  }, 0);
}

function checkout() {
  const cart = getSelectedCartItems(getSortedCartItems(getCart()));
  if (cart.length === 0) {
    showModal("⚠️ Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!", false);
    return;
  }

  const promoCalculation = getPromoCalculation(cart, appliedPromoCode);
  const subtotal = calculateSubtotal();
  const shipping = subtotal >= 500000 ? 0 : 30000;

  const orderInfo = {
    items: cart,
    subtotal,
    discount: promoCalculation.discountAmount,
    discountCode: promoCalculation.code,
    discountPercent: promoCalculation.rule?.percent || 0,
    shipping,
    total: Math.max(0, subtotal - promoCalculation.discountAmount + shipping),
    timestamp: new Date().toISOString(),
    userId: getCurrentUser().id,
  };
  localStorage.setItem("checkoutOrder", JSON.stringify(orderInfo));
  window.location.href = "payment.html";
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

  const cart = getSortedCartItems(getCart());
  const currentUser = getCurrentUser();
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
    selectedCartIds.clear();
    hasSelectionInitialized = false;
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
  let hasRenderableItem = false;
  const selectedCart = getSelectedCartItems(cart);
  const allSelected = cart.length > 0 && selectedCart.length === cart.length;

  const rowsHtml = cart
    .map((item) => {
      const resolved = resolveCartItem(item);
      if (
        !resolved ||
        !resolved.name ||
        !Number.isFinite(Number(resolved.price))
      ) {
        return "";
      }

      hasRenderableItem = true;
      const qty = item.quantity || 1;
      const total = resolved.price * qty;

      if (selectedCartIds.has(String(item.id))) {
        subtotal += total;
      }

      return `
            <tr>
            <td>
              <input type="checkbox" class="cart-row-check" ${selectedCartIds.has(String(item.id)) ? "checked" : ""} onchange='toggleCartItemSelection(${JSON.stringify(item.id)}, this.checked)'>
            </td>
                <td>
                    <div class="cart-product">
                        <div class="cart-product-img"><img src="${resolved.image}" alt="${resolved.name}"></div>
                        <div class="cart-product-info"><h4>${resolved.name}</h4></div>
                    </div>
                </td>
                <td class="cart-price">
                    ${formatPrice(resolved.price)}
                    ${resolved.originalPrice > resolved.price ? `<br><small style="color:#94a3b8;text-decoration:line-through;">${formatPrice(resolved.originalPrice)}</small>` : ""}
                </td>
                <td>
                    <div class="cart-quantity">
                        <button class="quantity-btn" onclick='updateQuantity(${JSON.stringify(item.id)}, -1)'>-</button>
                    <span class="quantity-value">${qty}</span>
                        <button class="quantity-btn" onclick='updateQuantity(${JSON.stringify(item.id)}, 1)'>+</button>
                    </div>
                </td>
                <td class="cart-total-item">${formatPrice(total)}</td>
                <td><button class="cart-remove" onclick='removeFromCart(${JSON.stringify(item.id)})'><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    })
    .join("");

  if (!hasRenderableItem) {
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

  const selectedPromoCalculation = getPromoCalculation(
    selectedCart,
    appliedPromoCode,
  );
  const discount = selectedPromoCalculation.discountAmount;
  const shipping =
    selectedCart.length === 0 ? 0 : subtotal > 500000 ? 0 : 30000;
  const finalTotal = subtotal - discount + shipping;

  container.innerHTML =
    userInfoHtml +
    `
        <div class="cart-layout">
            <div class="cart-items-section">
                <table class="cart-table">
                    <thead>
                    <tr>
                      <th><input type="checkbox" class="cart-select-all" ${allSelected ? "checked" : ""} onchange="toggleSelectAllCart(this.checked)"></th>
                      <th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th>
                    </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
            <div class="cart-summary">
                <h3>Đơn hàng</h3>
                <div class="summary-row"><span>Đã chọn:</span><span>${selectedCart.length}/${cart.length} sản phẩm</span></div>
                <div class="summary-row"><span>Tạm tính:</span><span>${formatPrice(subtotal)}</span></div>
                ${selectedPromoCalculation.code ? `<div class="summary-row"><span>Mã đã chọn:</span><span>${selectedPromoCalculation.code}</span></div>` : ""}
                ${selectedPromoCalculation.code ? `<div class="summary-row"><span>Ưu đãi hợp lệ:</span><span>${formatPrice(selectedPromoCalculation.eligibleSubtotal)}</span></div>` : ""}
                <div class="summary-row"><span>Giảm giá:</span><span style="color:#ff4757">-${formatPrice(discount)}</span></div>
                <div class="summary-row"><span>Phí ship:</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
                <div class="voucher-input">
                    <input type="text" id="voucherCode" placeholder="Nhập mã: ALL5A, ALL5B, ALL10A, ALL10B, ALL15A" value="${appliedPromoCode}">
                    <button onclick="applyVoucher()">Áp dụng</button>
                </div>
                ${selectedPromoCalculation.blockedByMultiItems ? '<small style="display:block;margin-top:8px;color:#dc2626;line-height:1.45;">Mã giảm giá chỉ áp dụng khi phần đã chọn có đúng 1 sản phẩm.</small>' : selectedPromoCalculation.code ? `<small style="display:block;margin-top:8px;color:#64748b;line-height:1.45;">${selectedPromoCalculation.rule.desc || "Áp dụng mọi sản phẩm"}. Mỗi mã chỉ dùng 1 lần.</small>` : '<small style="display:block;margin-top:8px;color:#64748b;line-height:1.45;">Mã 5% áp dụng mọi sản phẩm, 10% cho mọi sản phẩm, 15% cho mọi sản phẩm. Chỉ áp dụng cho 1 sản phẩm duy nhất và mỗi mã chỉ dùng 1 lần.</small>'}
                <div class="summary-row total"><span>Tổng cộng:</span><span>${formatPrice(finalTotal)}</span></div>
                <button class="checkout-btn" onclick="checkout()">💳 Thanh toán ngay</button>
                <a href="index.html" class="continue-shopping">← Tiếp tục mua sắm</a>
            </div>
        </div>
    `;

  syncVoucherInputWithAppliedCode();
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

document.addEventListener("DOMContentLoaded", () => {
  PROMO_CODES = getDefaultPromoCodes();
  // Không tự áp dụng mã đã sao chép; người dùng phải tự nhập/dán rồi bấm Áp dụng.
  appliedPromoCode = "";

  renderCartPage();
  updateCartCount();
  setupSearch();
  window.addEventListener("storage", () => {
    updateCartCount();
    renderCartPage();
  });
  window.addEventListener("focus", () => {
    updateCartCount();
    renderCartPage();
  });
  window.addEventListener("cartUpdated", () => {
    updateCartCount();
    renderCartPage();
  });
  window.addEventListener("pageshow", () => {
    updateCartCount();
    renderCartPage();
  });
});
