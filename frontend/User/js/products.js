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
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let products = [];
let currentCategory = "all";
let currentSort = "default";
let currentPage = 1;
const productsPerPage = 12;
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let searchKeyword = "";

document.addEventListener("DOMContentLoaded", () => {
  subscribeProductsFromFirebase();
  setupCategoryFilters();
  setupSortFilter();
  setupLoadMore();
  setupSearch();
  setupProductClick();
  updateCartCount();
  setupBackToTop();
});

function subscribeProductsFromFirebase() {
  onSnapshot(
    collection(db, "products"),
    (querySnapshot) => {
      products = querySnapshot.docs.map((doc) => {
        const data = doc.data() || {};

        return {
          id: doc.id,
          name: data.name || "Sản phẩm chưa có tên",
          price: Number(data.price) || 0,
          brand: data.brand || "PhoneStore",
          category: data.category || "all",
          image: resolveImageUrl(data.image),
          isNew: Boolean(data.isNew),
          isSale: Boolean(data.isSale),
          discount: Number(data.discount) || 0,
          updatedAt: getProductActivityValue(data),
        };
      });

      filteredProducts = getSearchedProducts();
      renderProducts();
    },
    (error) => {
      console.error("Không thể load sản phẩm từ Firebase:", error);
      showStatusMessage(
        "Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.",
      );
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

function getSearchedProducts() {
  const keyword = searchKeyword.trim().toLowerCase();

  if (!keyword) return [...products];

  return products.filter((product) => {
    return (
      product.name.toLowerCase().includes(keyword) ||
      product.brand.toLowerCase().includes(keyword)
    );
  });
}

function sortByNewest(productList) {
  return [...productList].sort((a, b) => {
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
    return String(b.id).localeCompare(String(a.id));
  });
}

function renderProducts() {
  const container = document.getElementById("all-products");
  if (!container) return;

  let displayProducts = [...filteredProducts];

  if (currentCategory !== "all") {
    displayProducts = displayProducts.filter(
      (product) => product.category === currentCategory,
    );
  }

  displayProducts = sortProducts(displayProducts, currentSort);

  const visibleCount = currentPage * productsPerPage;
  const visibleProducts = displayProducts.slice(0, visibleCount);

  container.innerHTML = "";
  if (visibleProducts.length === 0) {
    showStatusMessage("Không có sản phẩm phù hợp.");
  } else {
    const fragment = document.createDocumentFragment();
    visibleProducts.forEach((product) =>
      fragment.appendChild(createProductCard(product)),
    );
    container.appendChild(fragment);
  }

  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.style.display =
      visibleCount < displayProducts.length ? "inline-flex" : "none";
  }
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
  const image = card.querySelector(".product-card-image img");
  image.src = product.image || "https://placehold.co/300x200?text=No+Image";
  image.alt = product.name;

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
  if (product.isNew) badgeBox.innerHTML += '<span class="badge-new">Mới</span>';
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

function setupProductClick() {
  const container = document.getElementById("all-products");
  if (!container) return;

  container.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;

    const card = event.target.closest(".product-card");
    if (!card) return;

    const id = card.getAttribute("data-id");
    window.location.href = `detail.html?id=${encodeURIComponent(id)}`;
  });
}

function setupCategoryFilters() {
  document.querySelectorAll(".category-btn").forEach((button) => {
    button.addEventListener("click", function () {
      document
        .querySelectorAll(".category-btn")
        .forEach((item) => item.classList.remove("active"));
      this.classList.add("active");
      currentCategory = this.dataset.category;
      currentPage = 1;
      renderProducts();
    });
  });
}

function setupSortFilter() {
  const sortSelect = document.getElementById("sort-select");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", function () {
    currentSort = this.value;
    currentPage = 1;
    renderProducts();
  });
}

function setupLoadMore() {
  const button = document.getElementById("load-more-btn");
  if (!button) return;

  button.addEventListener("click", () => {
    currentPage += 1;
    renderProducts();
  });
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  const button = document.getElementById("searchBtn");

  // Đọc từ localStorage nếu trang khác chuyển sang
  const savedKeyword = localStorage.getItem("searchKeyword");
  if (savedKeyword) {
    searchKeyword = savedKeyword;
    if (input) input.value = savedKeyword;
    localStorage.removeItem("searchKeyword");
  }

  if (!input || !button) return;

  const search = () => {
    searchKeyword = input.value.trim();
    filteredProducts = getSearchedProducts();
    currentPage = 1;
    renderProducts();
  };

  button.addEventListener("click", search);
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") search();
  });
}

function sortProducts(productList, type) {
  const list = [...productList];

  if (type === "price_asc") return list.sort((a, b) => a.price - b.price);
  if (type === "price_desc") return list.sort((a, b) => b.price - a.price);
  if (type === "name_asc")
    return list.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  return sortByNewest(list);
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = document.querySelector(".cart-count");
  if (cartCount) cartCount.textContent = count;
}

function setupBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function showStatusMessage(message) {
  const container = document.getElementById("all-products");
  if (!container) return;

  container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
            <h3>${message}</h3>
        </div>
    `;
}

function formatPrice(price) {
  return `${(Number(price) || 0).toLocaleString("vi-VN")}₫`;
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

window.addToCart = function (id) {
  const product = products.find((item) => String(item.id) === String(id));
  if (!product) return;

  const cart = getCart();
  const existing = cart.find((item) => String(item.id) === String(id));
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

window.buyNow = function (id) {
  const product = products.find((item) => String(item.id) === String(id));
  if (!product) return;

  const cart = getCart();
  const existing = cart.find((item) => String(item.id) === String(id));
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
  localStorage.setItem("buyNowProductId", String(id));

  // Redirect to cart after a short delay
  setTimeout(() => {
    window.location.href = "cart.html";
  }, 500);
};
