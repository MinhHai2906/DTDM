const API_BASE_URL = "https://phonestore-backend-yt5q.onrender.com";

let products = [];
let searchKeyword = "";

function getTimestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value && typeof value.seconds === "number") {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
  }
  return 0;
}

// ========== DOM READY ==========
document.addEventListener("DOMContentLoaded", async function () {
  console.log(" Promotion page loaded");

  await loadProductsFromApi();

  // Setup countdown timer
  startCountdown();

  // Setup search
  setupSearch();

  // Setup click vào sản phẩm để chuyển trang chi tiết
  setupProductClick();

  // Render mã khuyến mãi cố định để copy và áp dụng ở giỏ hàng
  PROMO_CODES = getDefaultPromoCodes();
  renderVoucherCards();

  // Update cart count
  updateCartCount();
  // Setup back to top button
  setupBackToTop();
});

async function loadProductsFromApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const items = await response.json();
    products = Array.isArray(items)
      ? items.map((item) => ({
          id: item.id,
          name: item.name || "Sản phẩm chưa có tên",
          price: Number(item.price) || 0,
          brand: item.brand || "",
          category: item.category || "",
          image: resolveImageUrl(item.image),
          isSale: Boolean(item.isSale),
          discount: Number(item.discount) || 0,
          updatedAtMs: Math.max(
            Number(item.updatedAtMs) || 0,
            getTimestampMs(item.updatedAt),
            Number(item.createdAtMs) || 0,
            getTimestampMs(item.createdAt),
          ),
        }))
      : [];

    renderFlashSaleProducts();
  } catch (error) {
    console.error("Không thể đọc sản phẩm từ API:", error);
    const container = document.getElementById("flash-sale-products");
    if (container) {
      container.innerHTML = "<p>Không thể tải dữ liệu khuyến mãi.</p>";
    }
  }
}

function resolveImageUrl(imagePath) {
  if (!imagePath) return "https://placehold.co/300x200?text=No+Image";

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

// ========== BACK TO TOP BUTTON ==========
function setupBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

  // Hiển thị nút khi cuộn xuống 300px
  window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });

  // Cuộn lên đầu trang khi click
  backToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// ========== RENDER FLASH SALE ==========
function renderFlashSaleProducts() {
  const container = document.getElementById("flash-sale-products");
  if (!container) return;

  // Chỉ hiển thị sản phẩm có sale và sắp xếp từ giảm giá cao xuống thấp
  let flashSaleProducts = products
    .filter((p) => p && (p.isSale === true || Number(p.discount) > 0))
    .sort((a, b) => {
      const discountDiff = Number(b.discount || 0) - Number(a.discount || 0);
      if (discountDiff !== 0) return discountDiff;

      const timeDiff = getProductActivityValue(b) - getProductActivityValue(a);
      if (timeDiff !== 0) return timeDiff;

      return String(b.id).localeCompare(String(a.id));
    });

  // Lọc theo từ khóa tìm kiếm
  if (searchKeyword) {
    flashSaleProducts = flashSaleProducts.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const keyword = searchKeyword.toLowerCase();
      return name.includes(keyword) || brand.includes(keyword);
    });
  }

  if (flashSaleProducts.length === 0) {
    container.innerHTML = searchKeyword
      ? "<p>Không tìm thấy sản phẩm khuyến mãi phù hợp</p>"
      : "<p>Đang cập nhật...</p>";
    return;
  }

  container.innerHTML = flashSaleProducts
    .map((product) => createFlashSaleCard(product))
    .join("");
}

function getProductActivityValue(product) {
  const updatedAtMs = Number(product?.updatedAtMs) || 0;
  const updatedAt =
    typeof product?.updatedAt?.toMillis === "function"
      ? product.updatedAt.toMillis()
      : 0;
  const createdAtMs = Number(product?.createdAtMs) || 0;
  const createdAt =
    typeof product?.createdAt?.toMillis === "function"
      ? product.createdAt.toMillis()
      : 0;

  return Math.max(updatedAtMs, updatedAt, createdAtMs, createdAt);
}

// ========== CREATE FLASH SALE CARD ==========
function createFlashSaleCard(product) {
  const discountedPrice =
    product.discount > 0
      ? (product.price * (100 - product.discount)) / 100
      : product.price;

  return `
        <div class="product-card flash-sale-card" data-id="${product.id}" data-name="${String(product.name || "").replace(/"/g, "&quot;")}">
            <div class="product-badge">
                <span class="badge-flash"> FLASH SALE</span>
                ${product.discount > 0 ? `<span class="badge-sale">-${product.discount}%</span>` : ""}
            </div>
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='https://placehold.co/300x200?text=No+Image'">
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand || ""}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(discountedPrice)}</span>
                    <span class="old-price">${formatPrice(product.price)}</span>
                </div>
                <div class="product-actions">
                    <button class="btn-cart" onclick="window.addToCart('${String(product.id).replace(/'/g, "\\'")}')">
                        <i class="fas fa-shopping-cart"></i> Thêm giỏ
                    </button>
                    <button class="btn-buy-now" onclick="window.buyNow('${String(product.id).replace(/'/g, "\\'")}')"> 
                        <i class="fas fa-bolt"></i> Mua hàng
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========== CREATE PRODUCT CARD ==========
function createProductCard(product) {
  const discountedPrice =
    product.discount > 0
      ? (product.price * (100 - product.discount)) / 100
      : product.price;

  let badgeHtml = "";
  if (product.isNew) badgeHtml += '<span class="badge-new">Mới</span>';
  if (product.isSale || product.discount > 0) {
    badgeHtml += `<span class="badge-sale">-${product.discount || 10}%</span>`;
  }

  return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-badge">${badgeHtml}</div>
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='https://placehold.co/300x200?text=No+Image'">
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand || ""}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(discountedPrice)}</span>
                    ${product.discount > 0 ? `<span class="old-price">${formatPrice(product.price)}</span>` : ""}
                </div>
                <div class="product-actions">
                    <button class="btn-cart" onclick="window.addToCart('${String(product.id).replace(/'/g, "\\'")}')">
                        <i class="fas fa-shopping-cart"></i> Thêm giỏ
                    </button>
                    <button class="btn-buy-now" onclick="window.buyNow('${String(product.id).replace(/'/g, "\\'")}')"> 
                        <i class="fas fa-bolt"></i> Mua hàng
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========== CLICK VÀO SẢN PHẨM - CHUYỂN SANG TRANG CHI TIẾT ==========
function setupProductClick() {
  // Lấy container của flash-sale-products
  const flashSaleContainer = document.getElementById("flash-sale-products");
  if (flashSaleContainer) {
    flashSaleContainer.addEventListener("click", function (e) {
      // Không xử lý nếu click vào button mua ngay
      if (e.target.closest("button")) {
        return;
      }

      const productCard = e.target.closest(".product-card");
      if (!productCard) return;

      const productId = productCard.getAttribute("data-id");
      const productName = productCard.getAttribute("data-name");
      if (productId) {
        console.log(` Chuyển sang chi tiết sản phẩm ID: ${productId}`);
        const nameQuery = productName
          ? `&name=${encodeURIComponent(productName)}`
          : "";
        window.location.href = `detail.html?id=${encodeURIComponent(productId)}${nameQuery}`;
      }
    });
  }
}

// ========== COUNTDOWN TIMER ==========
function startCountdown() {
  // Set end time to 3 days from now
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + 3);
  endTime.setHours(23, 59, 59, 999);

  function updateCountdown() {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      document.getElementById("days").textContent = "00";
      document.getElementById("hours").textContent = "00";
      document.getElementById("minutes").textContent = "00";
      document.getElementById("seconds").textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("days").textContent = days
      .toString()
      .padStart(2, "0");
    document.getElementById("hours").textContent = hours
      .toString()
      .padStart(2, "0");
    document.getElementById("minutes").textContent = minutes
      .toString()
      .padStart(2, "0");
    document.getElementById("seconds").textContent = seconds
      .toString()
      .padStart(2, "0");
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ========== SETUP SEARCH ==========
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  const search = () => {
    searchKeyword = searchInput.value.trim();
    renderFlashSaleProducts();
  };

  if (searchBtn) {
    searchBtn.addEventListener("click", search);
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        search();
      }
    });
  }
}

// ========== VOUCHER FUNCTIONS ==========
async function copyTextToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  return copied;
}

async function copyVoucher(code) {
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();
  if (!normalizedCode) return;

  localStorage.setItem("copiedPromoCode", normalizedCode);
  localStorage.setItem("copiedPromoAt", new Date().toISOString());

  const copied = await copyTextToClipboard(normalizedCode);
  if (copied) {
    showCopyVoucherPopup(`Đã sao chép mã giảm giá: ${normalizedCode}`);
    return;
  }

  showCopyVoucherPopup(
    `Không thể tự sao chép. Vui lòng sao chép thủ công mã: ${normalizedCode}`,
    false,
  );
}

function showCopyVoucherPopup(message, isSuccess = true) {
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
  }, 2200);
}

window.copyVoucher = copyVoucher;

let PROMO_CODES = [];

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

function renderVoucherCards() {
  const container = document.getElementById("voucherCardsContainer");
  if (!container) return;

  const vouchers =
    PROMO_CODES.length > 0 ? PROMO_CODES : getDefaultPromoCodes();

  container.innerHTML = vouchers
    .map((voucher) => {
      return `
            <article class="voucher-card">
                <div>
                    <h4>${voucher.code}</h4>
                    <p>${voucher.desc || "Áp dụng mọi sản phẩm"}</p>
                </div>
                <div class="voucher-meta">
                    <span class="voucher-badge">Giảm ${voucher.percent}%</span>
                    <button class="voucher-copy-btn" onclick="copyVoucher('${voucher.code}')">Sao chép</button>
                </div>
            </article>
        `;
    })
    .join("");
}

// ========== COMBO FUNCTIONS ==========
function addComboToCart(comboId) {
  alert(` Đã thêm combo ${comboId} vào giỏ hàng!`);
  // Thêm logic xử lý combo ở đây
}

// ========== CART FUNCTIONS ==========
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();

  // Feedback
  const btn = event?.target?.closest(".btn-cart");
  if (btn) {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Đã thêm';
    setTimeout(() => (btn.innerHTML = originalHtml), 1500);
  }
}

function updateCartCount() {
  const count = JSON.parse(
    localStorage.getItem(getCartStorageKey()) || "[]",
  ).reduce((sum, item) => sum + item.quantity, 0);
  const cartSpan = document.querySelector(".cart-count");
  if (cartSpan) cartSpan.textContent = count;
}

function getCartStorageKey() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  return currentUser?.id ? `cart_${currentUser.id}` : "cart";
}

function getCart() {
  return JSON.parse(localStorage.getItem(getCartStorageKey()) || "[]");
}

function saveCart(cartData) {
  localStorage.setItem(getCartStorageKey(), JSON.stringify(cartData));
}

function showCartAddedModal(productName, quantity = 1) {
  const existingModal = document.querySelector(".custom-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.className = "custom-modal";
  modal.innerHTML = `
        <div class="custom-modal-content success">
            <i class="fas fa-check-circle"></i>
            <p>Đã thêm ${quantity} sản phẩm vào giỏ hàng${productName ? `: ${productName}` : ""}</p>
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

window.addToCart = function (productId) {
  const product = products.find(
    (item) => String(item.id) === String(productId),
  );
  if (!product) return;

  const cart = getCart();
  const existing = cart.find((item) => String(item.id) === String(productId));
  const currentPrice =
    product.discount > 0
      ? Math.round((product.price * (100 - product.discount)) / 100)
      : product.price;

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: currentPrice,
      originalPrice: product.price,
      discount: product.discount || 0,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCount();
  showCartAddedModal(product.name, 1);
};

window.buyNow = function (productId) {
  const product = products.find(
    (item) => String(item.id) === String(productId),
  );
  if (!product) return;

  const cart = getCart();
  const existing = cart.find((item) => String(item.id) === String(productId));
  const currentPrice =
    product.discount > 0
      ? Math.round((product.price * (100 - product.discount)) / 100)
      : product.price;

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: currentPrice,
      originalPrice: product.price,
      discount: product.discount || 0,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCount();

  // Mark this product as the one to select in cart page
  localStorage.setItem("buyNowProductId", String(productId));

  // Redirect to cart after a short delay
  setTimeout(() => {
    window.location.href = "cart.html";
  }, 500);
};

// ========== UTILITY ==========
function formatPrice(price) {
  return price?.toLocaleString("vi-VN") + "₫" || "0₫";
}

console.log(" promotion.js loaded - Đã thêm chức năng click vào sản phẩm");
