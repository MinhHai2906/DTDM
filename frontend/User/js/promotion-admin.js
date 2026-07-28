'use strict';

const ADMIN_PRODUCTS_KEY = 'mobistore_products';
let promoProducts = [];

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function resolveImageUrl(imagePath) {
    if (!imagePath) return 'https://placehold.co/400x300?text=No+Image';

    const normalizedPath = String(imagePath).replace(/\\/g, '/').trim();
    if (normalizedPath.startsWith('data:image/')) return normalizedPath;
    if (normalizedPath.startsWith('blob:')) return normalizedPath;
    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) return normalizedPath;
    if (normalizedPath.startsWith('./') || normalizedPath.startsWith('../')) return normalizedPath;
    if (normalizedPath.startsWith('assets/images/')) return normalizedPath;

    return `assets/images/${normalizedPath.split('/').pop()}`;
}

function getRawProducts() {
    const stored = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            // ignore invalid storage and fall through to empty list
        }
    }

    return [];
}

function getDiscountPercent(product) {
    const explicitDiscount = Number(product?.discount) || 0;
    if (explicitDiscount > 0) return explicitDiscount;

    const price = Number(product?.price) || 0;
    const originalPrice = Number(product?.originalPrice || product?.oldPrice) || 0;
    if (price > 0 && originalPrice > price) {
        return Math.round((1 - price / originalPrice) * 100);
    }

    return 0;
}

function getCurrentPrice(product) {
    const price = Number(product?.price) || 0;
    const originalPrice = Number(product?.originalPrice || product?.oldPrice) || 0;
    const discount = getDiscountPercent(product);

    if (originalPrice > price && price > 0) return price;
    if (discount > 0 && price > 0) return Math.round(price * (100 - discount) / 100);
    return price;
}

function getOldPrice(product) {
    const price = Number(product?.price) || 0;
    const originalPrice = Number(product?.originalPrice || product?.oldPrice) || 0;
    const discount = getDiscountPercent(product);

    if (originalPrice > price) return originalPrice;
    if (discount > 0 && price > 0) return price;
    return 0;
}

function isSellable(product) {
    const status = String(product?.status || 'active');
    if (status === 'inactive' || status === 'outofstock') return false;

    const stockValue = product?.stock;
    if (stockValue !== undefined && stockValue !== null && stockValue !== '') {
        const stock = Number(stockValue);
        if (Number.isFinite(stock) && stock <= 0) return false;
    }

    return true;
}

function normalizeProduct(raw, source) {
    const currentPrice = getCurrentPrice(raw);
    const oldPrice = getOldPrice(raw);
    const discount = getDiscountPercent(raw);

    return {
        id: raw?.id != null ? String(raw.id) : '',
        name: raw?.name || 'Sản phẩm',
        brand: raw?.brand || '',
        category: raw?.category || '',
        image: resolveImageUrl(raw?.image),
        price: currentPrice,
        oldPrice,
        discount,
        isSale: discount > 0,
        isNew: Boolean(raw?.isNew),
        status: raw?.status || 'active',
        stock: Number(raw?.stock) || 0,
        rating: Number(raw?.rating) || 0,
        source
    };
}

function loadPromoProducts() {
    const rawProducts = getRawProducts();
    return rawProducts
        .filter(isSellable)
        .map((raw) => normalizeProduct(raw, 'admin'));
}

function sortByDiscountDesc(list) {
    return [...list].sort((a, b) => {
        if (b.discount !== a.discount) return b.discount - a.discount;
        if (b.price !== a.price) return b.price - a.price;
        return String(a.name).localeCompare(String(b.name), 'vi');
    });
}

function formatPrice(price) {
    return `${(Number(price) || 0).toLocaleString('vi-VN')}₫`;
}

function renderFlashSaleProducts() {
    const container = $('flash-sale-products');
    if (!container) return;

    let flashSaleProducts = sortByDiscountDesc(
        promoProducts.filter((product) => product.discount >= 20)
    ).slice(0, 8);

    if (flashSaleProducts.length === 0) {
        flashSaleProducts = sortByDiscountDesc(
            promoProducts.filter((product) => product.discount > 0)
        ).slice(0, 8);
    }

    if (flashSaleProducts.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:30px;color:#666">Chưa có sản phẩm Flash Sale phù hợp.</p>';
        return;
    }

    container.innerHTML = flashSaleProducts.map((product) => createFlashSaleCard(product)).join('');
}

function createFlashSaleCard(product) {
    const currentPrice = product.price;
    const oldPrice = product.oldPrice || product.price;
    const soldPercent = Math.floor(Math.random() * 60) + 30;

    return `
        <div class="product-card flash-sale-card" data-id="${escapeHtml(product.id)}">
            <div class="product-badge">
                <span class="badge-flash">FLASH SALE</span>
                <span class="badge-sale">-${product.discount}%</span>
            </div>
            <div class="product-image">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" onerror="this.src='https://placehold.co/300x200?text=No+Image'">
            </div>
            <div class="product-info">
                <div class="product-brand">${escapeHtml(product.brand)}</div>
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(currentPrice)}</span>
                    <span class="old-price">${formatPrice(oldPrice)}</span>
                </div>
                <div class="sold-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${soldPercent}%"></div>
                    </div>
                    <span class="sold-text">Đã bán ${soldPercent}%</span>
                </div>
                <div class="product-actions">
                    <button class="btn-cart" onclick='addToCart(${JSON.stringify(product.id)})'>
                        <i class="fas fa-shopping-cart"></i> Mua ngay
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setupProductClick() {
    ['flash-sale-products'].forEach((containerId) => {
        const container = $(containerId);
        if (!container) return;

        container.addEventListener('click', (e) => {
            if (e.target.closest('.btn-cart')) return;

            const productCard = e.target.closest('.product-card');
            if (!productCard) return;

            const productId = productCard.getAttribute('data-id');
            if (productId) {
                window.location.href = `detail.html?id=${encodeURIComponent(productId)}`;
            }
        });
    });
}

function syncAndRender() {
    promoProducts = loadPromoProducts();
    renderFlashSaleProducts();
}

function setupBackToTop() {
    const backToTopBtn = $('backToTop');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        backToTopBtn.classList.toggle('show', window.scrollY > 300);
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function startCountdown() {
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 3);
    endTime.setHours(23, 59, 59, 999);

    const updateCountdown = () => {
        const diff = endTime - new Date();
        if (diff <= 0) {
            ['days', 'hours', 'minutes', 'seconds'].forEach((id) => {
                const el = $(id);
                if (el) el.textContent = '00';
            });
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if ($('days')) $('days').textContent = String(days).padStart(2, '0');
        if ($('hours')) $('hours').textContent = String(hours).padStart(2, '0');
        if ($('minutes')) $('minutes').textContent = String(minutes).padStart(2, '0');
        if ($('seconds')) $('seconds').textContent = String(seconds).padStart(2, '0');
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function setupSearch() {
    const searchInput = $('searchInput');
    const searchBtn = $('searchBtn');

    const goSearch = () => {
        const keyword = searchInput?.value.trim();
        if (!keyword) return;
        window.location.href = `products.html?search=${encodeURIComponent(keyword)}`;
    };

    if (searchBtn) searchBtn.addEventListener('click', goSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') goSearch();
        });
    }
}

function copyVoucher(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert(`Đã copy mã: ${code}\nSử dụng khi thanh toán để nhận ưu đãi!`);
    }).catch(() => {
        alert(`Mã giảm giá: ${code}`);
    });
}

function getCart() {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const key = user ? `cart_${user.id}` : 'cart';
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function saveCart(cart) {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const key = user ? `cart_${user.id}` : 'cart';
    localStorage.setItem(key, JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartSpan = document.querySelector('.cart-count');
    if (cartSpan) cartSpan.textContent = String(count);
}

function findPromoProduct(productId) {
    return promoProducts.find((product) => String(product.id) === String(productId));
}

function addToCart(productId) {
    const product = findPromoProduct(productId);
    if (!product) return;

    const cart = getCart();
    const existing = cart.find((item) => String(item.id) === String(product.id));

    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            brand: product.brand,
            originalPrice: product.oldPrice || 0,
            discount: product.discount || 0,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartCount();

    const btn = event?.target?.closest('.btn-cart');
    if (btn) {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Đã thêm';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 1500);
    }
}

function refreshOnStorageChange(e) {
    if (!e || e.key === ADMIN_PRODUCTS_KEY || e.key === null) {
        syncAndRender();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    syncAndRender();
    startCountdown();
    setupSearch();
    setupProductClick();
    updateCartCount();
    setupBackToTop();

    window.addEventListener('storage', refreshOnStorageChange);
    window.addEventListener('focus', syncAndRender);
});
