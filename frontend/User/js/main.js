import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  collection,
  getFirestore,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDk1XTVn68McS02jMIXnyQ3bqtpLF3L1XQ",
  authDomain: "web-dienthoai0-dtdm.firebaseapp.com",
  projectId: "web-dienthoai0-dtdm",
  storageBucket: "web-dienthoai0-dtdm.firebasestorage.app",
  messagingSenderId: "102142538462",
  appId: "1:102142538462:web:8c2c6c4637a54304ef484f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let products = [];
let currentBrand = "all";
let currentCategory = "all";

document.addEventListener("DOMContentLoaded", () => {
  setupBrandFilters();
  setupCategoryFilters();
  setupSearch();
  updateCartCount();
  setupBackToTop();
  subscribeProducts();

  const profileLinks = document.querySelectorAll(
    'a[href="profile.html"], #profileLink',
  );
  profileLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (!isLoggedIn()) {
        e.preventDefault();
        window.location.href = "signin.html";
      }
    });
  });
});

function subscribeProducts() {
  onSnapshot(
    collection(db, "products"),
    (snapshot) => {
      products = snapshot.docs.map((doc) => {
        const data = doc.data() || {};

        return {
          id: doc.id,
          name: data.name || "Sản phẩm chưa có tên",
          price: Number(data.price) || 0,
          brand: data.brand || "",
          category: data.category || "",
          image: resolveImageUrl(data.image),
          isNew: Boolean(data.isNew),
          isSale: Boolean(data.isSale),
          discount: Number(data.discount) || 0,
          rating: Number(data.rating) || 4.5,
          updatedAt: getProductActivityValue(data),
        };
      });

      renderFilteredProducts();
    },
    (error) => {
      console.error("Không thể đọc sản phẩm từ Firebase:", error);
      showStatusMessage("new-products", "Không thể tải dữ liệu sản phẩm.");
      showStatusMessage("sale-products", "Không thể tải dữ liệu sản phẩm.");
      showStatusMessage("all-products", "Không thể tải dữ liệu sản phẩm.");
    },
  );
}

function getProductActivityValue(data) {
  const updatedAtMs = Number(data?.updatedAtMs) || 0;
  const updatedAt =
    typeof data?.updatedAt?.toMillis === "function"
      ? data.updatedAt.toMillis()
      : 0;
  const createdAtMs = Number(data?.createdAtMs) || 0;
  const createdAt =
    typeof data?.createdAt?.toMillis === "function"
      ? data.createdAt.toMillis()
      : 0;

  return Math.max(updatedAtMs, updatedAt, createdAtMs, createdAt);
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

function getSortedProducts(productList) {
  return [...productList].sort((a, b) => {
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
    return String(b.id).localeCompare(String(a.id));
  });
}

function getFilteredProducts() {
  let filtered = getSortedProducts(products);

  if (currentBrand !== "all") {
    filtered = filtered.filter((product) => product.brand === currentBrand);
  }

  if (currentCategory !== "all") {
    filtered = filtered.filter(
      (product) => product.category === currentCategory,
    );
  }

  return filtered;
}

function renderFilteredProducts() {
  const filteredProducts = getFilteredProducts();
  const newestProducts = filteredProducts.slice(0, 8);
  const saleProducts = filteredProducts
    .filter((product) => product.isSale || product.discount > 0)
    .slice(0, 8);

  renderProducts("new-products", newestProducts, 8);
  renderProducts("sale-products", saleProducts, 8);
  renderProducts("all-products", filteredProducts, 12);
}

function renderProducts(containerId, productList, limit = 8) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const displayProducts = productList.slice(0, limit);
  container.innerHTML = "";

  if (displayProducts.length === 0) {
    showStatusMessage(containerId, "Không có sản phẩm");
    return;
  }

  const fragment = document.createDocumentFragment();
  displayProducts.forEach((product) => {
    fragment.appendChild(createProductCard(product));
  });
  container.appendChild(fragment);
}

function showStatusMessage(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<div class="text-center" style="grid-column: 1/-1; padding: 40px;">${message}</div>`;
}

function createProductCard(product) {
  const salePrice = Number(product.price) || 0;
  const discountPercent = Number(product.discount) || 0;
  const originalPrice =
    discountPercent > 0 && discountPercent < 100
      ? Math.round(salePrice / (1 - discountPercent / 100))
      : 0;
  const currentPrice = salePrice;
  const savedAmount =
    originalPrice > currentPrice ? Math.round(originalPrice - currentPrice) : 0;

  const template = document.getElementById("product-card-template");
  if (!template) return document.createElement("div");

  const card = template.content.firstElementChild.cloneNode(true);
  card.dataset.id = product.id;
  card.querySelector(".product-card-image img").src = product.image;
  card.querySelector(".product-card-image img").alt = product.name;
  card.querySelector(".product-brand").textContent = product.brand || "";
  card.querySelector(".product-name").textContent = product.name;
  card.querySelector(".current-price").textContent = formatPrice(currentPrice);

  const savingsElem = card.querySelector(".product-savings");
  if (savedAmount > 0) {
    savingsElem.textContent = `Tiết kiệm ${formatPrice(savedAmount)}`;
    savingsElem.style.display = "block";
  } else {
    savingsElem.remove();
  }

  const badgeBox = card.querySelector(".product-badge");
  badgeBox.innerHTML = "";
  if (product.updatedAt > 0 || product.isNew)
    badgeBox.innerHTML += '<span class="badge-new">Mới</span>';
  if (product.isSale || discountPercent > 0)
    badgeBox.innerHTML += `<span class="badge-sale">-${discountPercent || 0}%</span>`;

  card.querySelector(".btn-cart").addEventListener("click", (event) => {
    event.stopPropagation();
    window.addToCart(product.id);
  });

  card.querySelector(".btn-buy-now").addEventListener("click", (event) => {
    event.stopPropagation();
    window.buyNow(product.id);
  });

  return card;
}

function setupBrandFilters() {
  const brandBtns = document.querySelectorAll(".brand-btn");

  brandBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      brandBtns.forEach((item) => item.classList.remove("active"));
      this.classList.add("active");
      currentBrand = this.getAttribute("data-brand");
      renderFilteredProducts();
      document
        .querySelector(".filter-bar")
        ?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function setupCategoryFilters() {
  const categoryBtns = document.querySelectorAll(
    "#category-tabs .category-btn",
  );

  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      categoryBtns.forEach((item) => item.classList.remove("active"));
      this.classList.add("active");
      currentCategory = this.getAttribute("data-category");
      renderFilteredProducts();
    });
  });
}

function setupBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) backToTopBtn.classList.add("show");
    else backToTopBtn.classList.remove("show");
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");

  const search = () => {
    if (!input) return;

    const keyword = input.value.trim();
    if (!keyword) return;

    localStorage.setItem("searchKeyword", keyword);
    window.location.href = "products.html";
  };

  if (btn) btn.addEventListener("click", search);
  if (input)
    input.addEventListener("keypress", (event) => {
      if (event.key === "Enter") search();
    });
}

function isLoggedIn() {
  return localStorage.getItem("currentUser") !== null;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function addToCart(productId) {
  if (!isLoggedIn()) {
    localStorage.setItem("redirectAfterLogin", window.location.href);
    const confirmLogin = confirm(
      "Bạn cần đăng nhập để thêm sản phẩm vào giỏ. Đăng nhập ngay?",
    );
    if (confirmLogin) window.location.href = "signin.html";
    return;
  }

  const product = products.find(
    (item) => String(item.id) === String(productId),
  );
  if (!product) return;

  const currentPrice =
    product.discount > 0
      ? Math.round((product.price * (100 - product.discount)) / 100)
      : Number(product.price) || 0;
  const originalPrice =
    product.discount > 0 && product.discount < 100
      ? Math.round(currentPrice / (1 - product.discount / 100))
      : 0;

  const userId = getCurrentUser().id;
  const cartKey = "cart_" + userId;
  const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
  const existing = cart.find((item) => String(item.id) === String(productId));

  if (existing) existing.quantity++;
  else
    cart.push({
      ...product,
      price: currentPrice,
      originalPrice,
      quantity: 1,
    });

  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();

  const btn = event?.target?.closest(".btn-cart");
  if (btn) {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Đã thêm';
    setTimeout(() => {
      btn.innerHTML = originalHtml;
    }, 1500);
  }
}

function addToWishlist() {
  if (!isLoggedIn()) {
    localStorage.setItem("redirectAfterLogin", window.location.href);
    const confirmLogin = confirm(
      "Bạn cần đăng nhập để thêm vào yêu thích. Đăng nhập ngay?",
    );
    if (confirmLogin) window.location.href = "signin.html";
    return;
  }

  alert("❤️ Đã thêm vào danh sách yêu thích!");
}

function updateCartCount() {
  const cartSpan = document.querySelector(".cart-count");
  if (!cartSpan) return;

  if (!isLoggedIn()) {
    cartSpan.textContent = "0";
    return;
  }

  const cart = JSON.parse(localStorage.getItem(getCartStorageKey()) || "[]");
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartSpan.textContent = count;
}

function formatPrice(price) {
  return price?.toLocaleString("vi-VN") + "₫" || "0₫";
}

window.goToProductDetail = function (productId) {
  window.location.href = `detail.html?id=${encodeURIComponent(productId)}`;
};

window.buyNow = function (productId) {
  // Add product to shared cart (works whether user is logged in or not)
  const product = products.find(
    (item) => String(item.id) === String(productId),
  );
  if (!product) return;

  const cartKey = getCartStorageKey();
  const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
  const existing = cart.find((item) => String(item.id) === String(productId));

  if (existing) existing.quantity = Number(existing.quantity || 1) + 1;
  else {
    const currentPrice =
      product.discount > 0
        ? Math.round((product.price * (100 - product.discount)) / 100)
        : Number(product.price) || 0;
    const originalPrice =
      product.discount > 0 && product.discount < 100
        ? Math.round(currentPrice / (1 - product.discount / 100))
        : 0;

    cart.push({
      id: product.id,
      name: product.name,
      price: currentPrice,
      originalPrice,
      discount: Number(product.discount) || 0,
      image: product.image,
      quantity: 1,
    });
  }

  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();

  // Mark product for cart page selection and redirect to cart
  localStorage.setItem("buyNowProductId", String(productId));
  setTimeout(() => (window.location.href = "cart.html"), 300);
};

function getCartStorageKey() {
  const currentUser = getCurrentUser();
  return currentUser?.id ? `cart_${currentUser.id}` : "cart";
}

function getSharedCart() {
  return JSON.parse(localStorage.getItem(getCartStorageKey()) || "[]");
}

function saveSharedCart(cart) {
  localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
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
  // Add product to shared cart and show the nice modal (works when logged out)
  const product = products.find(
    (item) => String(item.id) === String(productId),
  );
  if (!product) return;

  const cart = getSharedCart();
  const existing = cart.find((item) => String(item.id) === String(productId));
  const currentPrice =
    product.discount > 0
      ? Math.round((product.price * (100 - product.discount)) / 100)
      : product.price;

  if (existing) {
    existing.quantity = Number(existing.quantity || 1) + 1;
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

  saveSharedCart(cart);
  updateCartCount();
  showCartAddedModal(product.name, 1);
};
