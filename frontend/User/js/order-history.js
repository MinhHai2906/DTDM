"use strict";
/* =============================================
   PHONESTORE – ORDER HISTORY  |  order-history.js
   Features: list, filter, search, detail modal
   with timeline, cancel, reorder, review, 
   pagination, toast, cart sync
   ============================================= */

// ─── STATE ──────────────────────────────────
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
}

function getUserId(user = getCurrentUser()) {
  return user?.id || user?.uid || "";
}

function getOrderStorageKey(userId = getUserId()) {
  return userId ? "ps_orders_" + userId : "ps_orders";
}

function loadUserOrders() {
  return [];
}

function clearLegacyOrderCaches(activeUserId) {
  try {
    localStorage.removeItem("ps_orders");

    // Keep user-scoped cache keys to avoid losing UI data if network/auth restoration is slow.
    if (activeUserId) {
      const activeKey = getOrderStorageKey(activeUserId);
      const cached = localStorage.getItem(activeKey);
      if (!cached) {
        localStorage.setItem(activeKey, "[]");
      }
    }
  } catch (error) {
    console.warn("Không thể dọn cache đơn hàng cũ:", error.message);
  }
}

let orders = loadUserOrders();
let filtered = [...orders];
let activeStatus = "";
let searchQuery = "";
let currentPage = 1;
const PAGE_SIZE = 5;
let detailId = null;
let cancelId = null;

const DEFAULT_USER = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  phone: "0901 234 567",
  birthday: "1995-06-15",
  gender: "male",
  idCard: "079095001234",
  avatar: "",
  joined: "01/2025",
  memberTag: "Thành viên Vàng",
  twoFA: true,
};

function loadUser() {
  // Giống profile.js: luôn ưu tiên currentUser để đúng tài khoản đang đăng nhập
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser) return DEFAULT_USER;

  return {
    ...DEFAULT_USER,
    name:
      currentUser.name ||
      currentUser.displayName ||
      currentUser.fullName ||
      DEFAULT_USER.name,
    email: currentUser.email || DEFAULT_USER.email,
    phone: currentUser.phone || DEFAULT_USER.phone,
    avatar: currentUser.avatar || DEFAULT_USER.avatar,
    joined: currentUser.joined || DEFAULT_USER.joined,
  };
}
let user = loadUser();

function renderUserUI() {
  user = loadUser();
  if (!user) return;

  const avatar =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=b7791f&color=fff&size=80&rounded=true`;

  if ($("sidebarAvatar")) $("sidebarAvatar").src = avatar;
  if ($("sidebarName")) $("sidebarName").textContent = user.name;
  if ($("sidebarEmail")) $("sidebarEmail").textContent = user.email;
}

// ─── HELPERS ────────────────────────────────
const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";
const toDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;
    const d = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
      ? new Date(`${normalized}T00:00:00`)
      : new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }

    const rawSeconds =
      value.seconds ?? value._seconds ?? value.timestamp ?? value.unix;
    if (rawSeconds != null) {
      const seconds = Number(rawSeconds);
      if (!Number.isNaN(seconds)) {
        const d = new Date(seconds * 1000);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }
  }

  return null;
};
const fmtDate = (value, fallback = "") => {
  const d = toDateValue(value);
  if (!d) return fallback || "Không xác định";

  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const getOrderDateValue = (order) =>
  order?.date || order?.createdAt || order?.noteCreatedAt || null;
const getOrderCreatedTime = (order) => {
  const dateValue =
    toDateValue(order?.createdAt) || toDateValue(order?.date) || null;
  return dateValue ? dateValue.getTime() : 0;
};
const orderSubtotal = (o) =>
  (Array.isArray(o.items) ? o.items : []).reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) * (Number(item.qty || item.quantity) || 1),
    0,
  );
const orderTotal = (o) =>
  orderSubtotal(o) + (Number(o.shipping) || 0) - (Number(o.discount) || 0);
const statusClassName = (status) => {
  const map = {
    pending: "pending",
    "Chờ xác nhận": "pending",
    confirmed: "confirmed",
    "Đã xác nhận": "confirmed",
    shipping: "shipping",
    "Đang giao hàng": "shipping",
    delivered: "delivered",
    "Đã giao hàng thành công": "delivered",
    cancelled: "cancelled",
    "Đã hủy": "cancelled",
  };
  return `status-${map[status] || "pending"}`;
};

const STATUS_LABEL = {
  pending: "Chờ xác nhận",
  "Chờ xác nhận": "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  "Đã xác nhận": "Đã xác nhận",
  shipping: "Đang giao hàng",
  "Đang giao hàng": "Đang giao hàng",
  delivered: "Đã giao hàng thành công",
  "Đã giao hàng thành công": "Đã giao hàng thành công",
  cancelled: "Đã hủy",
  "Đã hủy": "Đã hủy",
};
const STATUS_ICON = {
  pending: "fa-clock",
  "Chờ xác nhận": "fa-clock",
  confirmed: "fa-check-circle",
  "Đã xác nhận": "fa-check-circle",
  shipping: "fa-truck",
  "Đang giao hàng": "fa-truck",
  delivered: "fa-circle-check",
  "Đã giao hàng thành công": "fa-circle-check",
  cancelled: "fa-times-circle",
  "Đã hủy": "fa-times-circle",
};
const PAY_ICON = {
  "Chuyển khoản ngân hàng": "fa-university",
  "Tiền mặt khi nhận hàng": "fa-money-bill-wave",
  "Ví MoMo": "fa-wallet",
  VNPay: "fa-qrcode",
};
const TL_ICONS = {
  "Đặt hàng": "fa-shopping-cart",
  "Đã xác nhận": "fa-check",
  "Đang giao hàng": "fa-truck",
  "Đã giao hàng thành công": "fa-circle-check",
  "Đã hủy": "fa-times",
};

function saveOrder(order) {
  const user = getCurrentUser();
  if (!user) return;
  const key = getOrderStorageKey(getUserId(user));
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  const index = existing.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    existing[index] = order;
  } else {
    existing.push(order);
  }
  localStorage.setItem(key, JSON.stringify(existing));
}

function saveOrders() {
  const user = getCurrentUser();
  if (!user) return;
  const key = getOrderStorageKey(getUserId(user));
  localStorage.setItem(key, JSON.stringify(orders));
  syncOrdersToFirestore();
}

function waitForFirebase() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const timer = setInterval(() => {
      if (window.firebaseDb && window.firebaseAuth) {
        clearInterval(timer);
        resolve({ auth: window.firebaseAuth, db: window.firebaseDb });
        return;
      }

      attempts += 1;
      if (attempts > 100) {
        clearInterval(timer);
        reject(new Error("Firebase chưa sẵn sàng"));
      }
    }, 50);
  });
}

function normalizeOrder(raw = {}, fallbackId = "") {
  const paymentMethod =
    raw.payment?.method ||
    raw.paymentMethod ||
    raw.payment ||
    "Tiền mặt khi nhận hàng";
  const paymentStatus =
    raw.payment?.status || raw.paymentStatus || "Chờ xác nhận";
  const items = Array.isArray(raw.items) ? raw.items : [];

  return {
    id: raw.id || fallbackId,
    orderCode: raw.orderCode || raw.id || fallbackId,
    userId: raw.userId || "",
    customer: raw.customer || raw.name || "",
    phone: raw.phone || "",
    email: raw.email || "",
    address: raw.addressText || raw.address || "",
    addressText: raw.addressText || raw.address || "",
    province: raw.province || "",
    district: raw.district || "",
    ward: raw.ward || "",
    note: raw.note || "",
    items: items.map((item) => ({
      name: item.name || "",
      qty: Number(item.qty || item.quantity) || 1,
      price: Number(item.price) || 0,
      img: item.img || item.image || "",
      variant: item.variant || "",
    })),
    subtotal: Number(raw.subtotal) || 0,
    discount: Number(raw.discount) || 0,
    shipping: Number(raw.shipping) || 0,
    status: raw.status || "Chờ xác nhận",
    payment: {
      method: paymentMethod,
      status: paymentStatus,
    },
    paymentMethod,
    paymentStatus,
    reviewed: !!raw.reviewed,
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

function buildTimelineForStatus(status, createdAt = new Date()) {
  const timestamp = fmtDate(createdAt, fmtDate(new Date()));

  if (status === "Đã hủy") {
    return [
      { step: "Đặt hàng", done: true, current: false, time: timestamp },
      {
        step: "Đã hủy",
        done: true,
        current: true,
        cancelled: true,
        time: timestamp,
      },
    ];
  }

  return [
    {
      step: "Đặt hàng",
      done: true,
      current: status === "Chờ xác nhận",
      time: timestamp,
    },
    {
      step: "Đã xác nhận",
      done: [
        "Đã xác nhận",
        "Đang giao hàng",
        "Đã giao hàng thành công",
      ].includes(status),
      current: status === "Đã xác nhận",
      time: status === "Đã xác nhận" ? timestamp : "",
    },
    {
      step: "Đang giao hàng",
      done: ["Đang giao hàng", "Đã giao hàng thành công"].includes(status),
      current: status === "Đang giao hàng",
      time: status === "Đang giao hàng" ? timestamp : "",
    },
    {
      step: "Đã giao hàng thành công",
      done: status === "Đã giao hàng thành công",
      current: status === "Đã giao hàng thành công",
      time: status === "Đã giao hàng thành công" ? timestamp : "",
    },
  ];
}

async function persistOrderToFirestore(order) {
  try {
    const { db } = await waitForFirebase();
    const payload = { ...order };
    delete payload.id;
    delete payload.orderCode;
    await db.collection("orders").doc(order.id).set(payload, { merge: true });
  } catch (error) {
    console.warn("Không thể đồng bộ đơn hàng lên Firebase:", error.message);
  }
}

async function deleteOrderFromFirestore(orderId) {
  try {
    const { db } = await waitForFirebase();
    await db.collection("orders").doc(orderId).delete();
  } catch (error) {
    console.warn("Không thể xóa đơn hàng trên Firebase:", error.message);
  }
}

async function syncOrdersToFirestore() {
  const tasks = orders.map((order) => persistOrderToFirestore(order));
  await Promise.all(tasks);
}

let unsubscribeOrdersSnapshot = null;

function subscribeFirebaseOrders() {
  waitForFirebase()
    .then(({ db, auth }) => {
      auth.onAuthStateChanged((authUser) => {
        if (unsubscribeOrdersSnapshot) {
          unsubscribeOrdersSnapshot();
          unsubscribeOrdersSnapshot = null;
        }

        if (!authUser) {
          orders = [];
          filtered = [];
          applyFilter();
          return;
        }

        const user = getCurrentUser() || {};
        const authUid = authUser.uid;

        if (getUserId(user) !== authUid) {
          localStorage.setItem(
            "currentUser",
            JSON.stringify({
              ...user,
              id: authUid,
              uid: authUid,
              email: user.email || authUser.email || "",
              name: user.name || authUser.displayName || "Khách hàng",
              avatar: user.avatar || authUser.photoURL || "",
            }),
          );
        }

        clearLegacyOrderCaches(authUid);
        orders = [];
        filtered = [];
        applyFilter();

        unsubscribeOrdersSnapshot = db
          .collection("orders")
          .where("userId", "==", authUid)
          .onSnapshot(
            (snapshot) => {
              const remoteOrders = snapshot.docs.map((doc) =>
                normalizeOrder({ id: doc.id, ...doc.data() }, doc.id),
              );

              remoteOrders.sort((a, b) => {
                const left = getOrderCreatedTime(a);
                const right = getOrderCreatedTime(b);
                return right - left;
              });

              orders = remoteOrders;
              const key = getOrderStorageKey(authUid);
              localStorage.setItem(key, JSON.stringify(orders));
              filtered = [...orders];
              applyFilter();
            },
            (error) => {
              console.error("Firestore orders listener failed:", error);
            },
          );
      });
    })
    .catch((error) => {
      console.warn("Không thể lắng nghe đơn hàng Firebase:", error.message);
    });
}

// ─── CART COUNT SYNC (from main site) ───────
function syncCartCount() {
  try {
    const currentUser = getCurrentUser();
    const key = currentUser ? `cart_${getUserId(currentUser)}` : "cart";
    let cart = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(cart)) cart = [];

    if (currentUser && cart.length === 0) {
      const legacyCart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (Array.isArray(legacyCart) && legacyCart.length > 0) {
        localStorage.setItem(key, JSON.stringify(legacyCart));
        cart = legacyCart;
      } else {
        const fallbackCarts = [];
        for (let index = 0; index < localStorage.length; index++) {
          const storageKey = localStorage.key(index);
          if (
            !storageKey ||
            !storageKey.startsWith("cart_") ||
            storageKey === key
          )
            continue;

          try {
            const fallbackParsed = JSON.parse(
              localStorage.getItem(storageKey) || "[]",
            );
            const fallbackCart = Array.isArray(fallbackParsed)
              ? fallbackParsed
              : [];
            if (fallbackCart.length > 0) {
              fallbackCarts.push(fallbackCart);
            }
          } catch {
            // ignore invalid fallback cart
          }
        }

        if (fallbackCarts.length === 1) {
          localStorage.setItem(key, JSON.stringify(fallbackCarts[0]));
          cart = fallbackCarts[0];
        }
      }
    }

    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    document.querySelectorAll("#cartCount, .cart-count").forEach((el) => {
      el.textContent = String(count);
    });
  } catch (e) {
    /* silent */
  }
}

// ─── TOAST ──────────────────────────────────
function toast(msg, type = "success") {
  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    info: "fa-tag",
    warning: "fa-exclamation-circle",
  };
  const el = document.createElement("div");
  el.className = `oh-toast ${type}`;
  el.innerHTML = `
        <div class="oh-toast-icon"><i class="fas ${icons[type]}"></i></div>
        <span>${msg}</span>`;
  $("toastContainer").appendChild(el);
  setTimeout(() => {
    el.classList.add("hide");
    setTimeout(() => el.remove(), 320);
  }, 3200);
}

// ─── FILTER & RENDER ────────────────────────
function applyFilter() {
  filtered = orders.filter((o) => {
    const mStatus = !activeStatus || o.status === activeStatus;
    const q = searchQuery.toLowerCase();
    const mSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q));
    return mStatus && mSearch;
  });
  currentPage = 1;
  renderList();
  renderPagination();
  updateBadge();
}

function updateBadge() {
  $("ohTotalBadge").textContent = `${filtered.length} đơn hàng`;
}

// ─── RENDER ORDER LIST ──────────────────────
function renderList() {
  const list = $("ohList");
  const empty = $("ohEmpty");
  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filtered.slice(start, start + PAGE_SIZE);

  if (page.length === 0) {
    list.innerHTML = "";
    empty.classList.add("show");
    return;
  }
  empty.classList.remove("show");

  list.innerHTML = page
    .map((o, idx) => {
      const total = orderTotal(o);
      const showItems = o.items.slice(0, 2);
      const moreCount = o.items.length - 2;
      const paymentMethod =
        o.payment?.method || o.paymentMethod || "Tiền mặt khi nhận hàng";
      const paymentStatus =
        o.payment?.status || o.paymentStatus || "Chờ xác nhận";
      const payIcon = PAY_ICON[paymentMethod] || "fa-credit-card";
      const canCancel = ["Chờ xác nhận", "Đã xác nhận"].includes(o.status);
      const isDelivered = o.status === "Đã giao hàng thành công";
      const isShipping = o.status === "Đang giao hàng";
      const orderDate = fmtDate(getOrderDateValue(o), fmtDate(new Date()));

      return `
        <div class="order-card" style="animation-delay:${idx * 0.07}s">
          <div class="order-card-header">
            <span class="order-card-id" onclick="openDetail('${o.id}')">
              <i class="fas fa-receipt" style="font-size:11px;margin-right:4px"></i>${o.id}
            </span>
                        <span class="order-card-date">
                    <i class="fas fa-calendar-alt"></i> ${orderDate}
                        </span>
                        <span class="order-status-badge ${statusClassName(o.status)}">
                            <i class="fas ${STATUS_ICON[o.status] || "fa-clock"}"></i> ${STATUS_LABEL[o.status] || o.status}
            </span>
          </div>

          <div class="order-card-products">
            ${showItems
              .map(
                (item) => `
            <div class="order-prod-thumb">
              <img class="order-prod-img" src="${item.img}" alt="${item.name}"
                   onerror="this.src='https://placehold.co/56x56/fff5e6/b7791f?text=SP'">
              <div class="order-prod-info">
                <div class="order-prod-name">${item.name}</div>
                <div class="order-prod-variant">${item.variant}</div>
                <div class="order-prod-qty-price">
                  <span class="order-prod-qty">x${item.qty}</span>
                  <span class="order-prod-price">${fmt(item.price)}</span>
                </div>
              </div>
            </div>`,
              )
              .join("")}
            ${moreCount > 0 ? `<span class="order-more-items" onclick="openDetail('${o.id}')"><i class="fas fa-plus"></i> +${moreCount} sản phẩm</span>` : ""}
          </div>

          <div class="order-card-footer">
            <div>
              <div class="order-total-wrap">
                <span class="order-total-label">Tổng tiền</span>
                <span class="order-total-value">${fmt(total)}</span>
              </div>
              <div class="order-payment-method" style="margin-top:6px">
                                <i class="fas ${payIcon}"></i> ${paymentMethod} · ${paymentStatus}
              </div>
            </div>
            <div class="order-card-actions">
              <button class="btn-view-detail" onclick="openDetail('${o.id}')"><i class="fas fa-eye"></i> Chi tiết</button>
              ${isShipping ? `<button class="btn-track" onclick="openDetail('${o.id}')"><i class="fas fa-map-marker-alt"></i> Theo dõi</button>` : ""}
              ${
                isDelivered
                  ? `<button class="btn-review${o.reviewed ? " btn-review-done" : ""}" onclick="reviewOrder('${o.id}')">
                <i class="fas fa-star"></i> ${o.reviewed ? "Đã đánh giá" : "Đánh giá"}
              </button>`
                  : ""
              }
              ${isDelivered || o.status === "Đã hủy" ? `<button class="btn-reorder" onclick="reorder('${o.id}')"><i class="fas fa-redo"></i> Mua lại</button>` : ""}
              ${canCancel ? `<button class="btn-cancel-order" onclick="openCancelModal('${o.id}')"><i class="fas fa-times"></i> Hủy đơn</button>` : ""}
            </div>
          </div>
        </div>`;
    })
    .join("");
}

// ─── PAGINATION ─────────────────────────────
function renderPagination() {
  const total = filtered.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const pg = $("ohPagination");
  if (pages <= 1) {
    pg.innerHTML = "";
    return;
  }

  let h = `<button class="pg-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) {
    if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === pages - 2)
        h += `<span class="pg-btn" style="cursor:default;pointer-events:none">…</span>`;
      continue;
    }
    h += `<button class="pg-btn ${i === currentPage ? "active" : ""}" onclick="goPage(${i})">${i}</button>`;
  }
  h += `<button class="pg-btn" onclick="goPage(${currentPage + 1})" ${currentPage === pages ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button>`;
  pg.innerHTML = h;
}

function goPage(p) {
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  if (p < 1 || p > pages) return;
  currentPage = p;
  renderList();
  renderPagination();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── TAB FILTER ─────────────────────────────
document.querySelectorAll(".oh-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".oh-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    activeStatus = tab.dataset.status;
    applyFilter();
  });
});

// ─── SEARCH ─────────────────────────────────
const ohSearchInput = $("ohSearch");
if (ohSearchInput) {
  ohSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    applyFilter();
  });
}

// ─── DETAIL MODAL ───────────────────────────
function openDetail(id) {
  const o = orders.find((x) => x.id === id);
  if (!o) return;
  detailId = id;
  const paymentMethod =
    o.payment?.method || o.paymentMethod || "Tiền mặt khi nhận hàng";
  const paymentStatus = o.payment?.status || o.paymentStatus || "Chờ xác nhận";

  $("modalOrderId").innerHTML = `<i class="fas fa-receipt"></i> ${o.id}`;
  $("modalDate").textContent =
    `Đặt ngày: ${fmtDate(getOrderDateValue(o), fmtDate(new Date()))}`;

  // Timeline
  renderTimeline(o);

  // Products
  $("modalProducts").innerHTML = o.items
    .map(
      (item) => `
    <div class="modal-prod-row">
      <img class="modal-prod-img" src="${item.img}" alt="${item.name}"
           onerror="this.src='https://placehold.co/64x64/fff5e6/b7791f?text=SP'">
      <div class="modal-prod-details">
        <div class="modal-prod-name">${item.name}</div>
        <div class="modal-prod-variant">${item.variant}</div>
        <div class="modal-prod-qty-price">
          <span class="modal-prod-qty">Số lượng: ${item.qty} · Đơn giá: ${fmt(item.price)}</span>
        </div>
      </div>
      <span class="modal-prod-subtotal">${fmt(item.price * item.qty)}</span>
    </div>`,
    )
    .join("");

  // Address
  $("modalAddress").innerHTML = `
            <strong>${o.customer || "Khách hàng"}</strong> &nbsp;
            <i class="fas fa-phone" style="color:var(--gold-primary);font-size:11px"></i> ${o.phone || "—"}<br>
            ${o.addressText || o.address || "—"}
            ${
              o.note
                ? `<br><span style="color:var(--gold-primary);font-size:12px;margin-top:4px;display:inline-block">
                <i class="fas fa-sticky-note"></i> ${o.note}</span>`
                : ""
            }`;

  // Payment
  const payIcon = PAY_ICON[paymentMethod] || "fa-credit-card";
  $("modalPayment").innerHTML = `
            <strong><i class="fas ${payIcon}" style="color:var(--gold-primary);margin-right:5px"></i>${paymentMethod}</strong><br>
            <span style="color:${paymentStatus === "Chờ thanh toán" ? "var(--warning)" : "var(--success)"};font-weight:700;font-size:12.5px">
                <i class="fas fa-${paymentStatus === "Chờ thanh toán" ? "hourglass-half" : "check-circle"}"></i> ${paymentStatus}
      </span>`;

  // Summary
  const sub = orderSubtotal(o);
  $("sumSubtotal").textContent = fmt(sub);
  $("sumShipping").textContent =
    o.shipping === 0 ? "Miễn phí" : fmt(o.shipping);
  if (o.discount > 0) {
    $("discountRow").style.display = "flex";
    $("sumDiscount").textContent = "- " + fmt(o.discount);
  } else {
    $("discountRow").style.display = "none";
  }
  $("sumTotal").textContent = fmt(orderTotal(o));

  // Footer buttons
  const canCancel = ["Chờ xác nhận", "Đã xác nhận"].includes(o.status);
  const isDelivered = o.status === "Đã giao hàng thành công";
  const isShipping = o.status === "Đang giao hàng";
  $("modalFooter").innerHTML = `
      ${isShipping ? `<button class="btn-track" onclick="trackOrder()"><i class="fas fa-map-marker-alt"></i> Theo dõi đơn hàng</button>` : ""}
      ${
        isDelivered
          ? `<button class="btn-review${o.reviewed ? " btn-review-done" : ""}" onclick="reviewOrder('${o.id}')">
        <i class="fas fa-star"></i> ${o.reviewed ? "Đã đánh giá" : "Đánh giá ngay"}
      </button>`
          : ""
      }
    ${isDelivered || o.status === "Đã hủy" ? `<button class="btn-reorder" onclick="reorder('${o.id}')"><i class="fas fa-redo"></i> Mua lại</button>` : ""}
      ${canCancel ? `<button class="btn-cancel-order" onclick="closeDetail();openCancelModal('${o.id}')"><i class="fas fa-times"></i> Hủy đơn</button>` : ""}
      <button class="btn-view-detail" onclick="closeDetail()"><i class="fas fa-times"></i> Đóng</button>`;

  showModal("modalBackdrop");
}

function renderTimeline(o) {
  const wrap = $("timelineWrap");
  const steps =
    Array.isArray(o.timeline) && o.timeline.length > 0
      ? o.timeline
      : buildTimelineForStatus(o.status, getOrderDateValue(o) || new Date());
  const doneCount = steps.filter((s) => s.done && !s.cancelled).length;
  const total = steps.length;
  let pct = total > 1 ? Math.max(0, ((doneCount - 1) / (total - 1)) * 100) : 0;
  if (o.status === "Đã hủy")
    pct = ((steps.filter((s) => s.done).length - 1) / (total - 1)) * 100;

  wrap.innerHTML =
    `<div class="timeline-line-fill" style="width:${pct}%"></div>` +
    steps
      .map((step) => {
        let cls = "tl-step-inactive";
        let dotCls = "inactive";
        if (step.cancelled) {
          cls = "tl-step-cancelled";
          dotCls = "done";
        } else if (step.current) {
          cls = "tl-step-current";
          dotCls = "current";
        } else if (step.done) {
          cls = "tl-step-done";
          dotCls = "done";
        }
        const icon = TL_ICONS[step.step] || "fa-circle";
        return `
            <div class="timeline-step ${cls}">
              <div class="tl-dot ${dotCls}" style="${step.cancelled ? "background:var(--danger);border-color:var(--danger);color:#fff" : ""}">
                <i class="fas ${icon}" style="font-size:13px"></i>
              </div>
              <div class="tl-label">${step.step}</div>
              ${step.time ? `<div class="tl-time">${step.time}</div>` : ""}
            </div>`;
      })
      .join("");
}

function closeDetail() {
  hideModal("modalBackdrop");
}
$("modalClose").addEventListener("click", closeDetail);
$("modalBackdrop").addEventListener("click", (e) => {
  if (e.target === $("modalBackdrop")) closeDetail();
});

function openLogoutConfirm() {
  const backdrop = $("logoutConfirmBackdrop");
  if (!backdrop) return;
  backdrop.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeLogoutConfirm() {
  const backdrop = $("logoutConfirmBackdrop");
  if (!backdrop) return;
  backdrop.classList.remove("show");
  document.body.style.overflow = "";
}

function clearFirebaseAuthCache() {
  const authPrefixes = ["firebase:authUser:", "firebase:host:"];
  const removeKeysByPrefix = (storage) => {
    const keys = [];
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key && authPrefixes.some((prefix) => key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    keys.forEach((key) => storage.removeItem(key));
  };

  removeKeysByPrefix(localStorage);
  removeKeysByPrefix(sessionStorage);
}

function initLogout() {
  const btn = $("logoutBtn");
  const confirmBtn = $("logoutConfirmBtn");
  const cancelBtn = $("logoutCancelBtn");
  const backdrop = $("logoutConfirmBackdrop");
  if (!btn || !confirmBtn || !cancelBtn || !backdrop) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openLogoutConfirm();
  });

  cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeLogoutConfirm();
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closeLogoutConfirm();
    }
  });

  confirmBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    localStorage.setItem("ps_force_logout", "1");

    if (window.googleAuth && typeof window.googleAuth.logout === "function") {
      try {
        await window.googleAuth.logout();
      } catch (error) {
        console.warn(
          "Google auth logout failed, falling back to local logout:",
          error,
        );
      }
    } else if (
      window.firebaseAuth &&
      typeof window.firebaseAuth.signOut === "function"
    ) {
      try {
        await window.firebaseAuth.signOut();
      } catch (error) {
        console.warn(
          "Firebase auth signOut failed, fallback to local cleanup:",
          error,
        );
      }
    }

    const currentUser = getCurrentUser();
    if (currentUser?.id) {
      localStorage.removeItem(`ps_orders_${currentUser.id}`);
    }
    localStorage.removeItem("currentUser");
    localStorage.removeItem("redirectAfterLogin");
    localStorage.removeItem("ps_user");
    sessionStorage.removeItem("googleUserData");
    clearFirebaseAuthCache();
    closeLogoutConfirm();
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
    toast("Đã đăng xuất. Đang chuyển hướng đến đăng nhập...", "info");
    setTimeout(() => {
      window.location.replace("signin.html");
    }, 1200);
  });
}

// ─── CANCEL ORDER ───────────────────────────
function openCancelModal(id) {
  cancelId = id;
  $("cancelText").innerHTML =
    `Bạn có chắc muốn hủy đơn hàng <strong>${id}</strong>? Thao tác này không thể hoàn tác.`;
  $("cancelReason").value = "";
  showModal("cancelBackdrop");
}

$("cancelYes").addEventListener("click", async () => {
  if (!$("cancelReason").value) {
    toast("Vui lòng chọn lý do hủy đơn!", "warning");
    return;
  }
  const o = orders.find((x) => x.id === cancelId);
  if (!o) return;
  const orderId = cancelId;
  const user = getCurrentUser();
  const userId = getUserId(user);

  orders = orders.filter((x) => x.id !== orderId);
  filtered = filtered.filter((x) => x.id !== orderId);
  const storageKey = getOrderStorageKey(userId);
  localStorage.setItem(storageKey, JSON.stringify(orders));

  hideModal("cancelBackdrop");
  applyFilter();

  await deleteOrderFromFirestore(orderId);

  toast(`Đã hủy và xóa đơn hàng ${orderId} thành công!`, "info");
  cancelId = null;
});

$("cancelNo").addEventListener("click", () => hideModal("cancelBackdrop"));
$("cancelBackdrop").addEventListener("click", (e) => {
  if (e.target === $("cancelBackdrop")) hideModal("cancelBackdrop");
});

// ─── ACTIONS ────────────────────────────────
function reorder(id) {
  const o = orders.find((x) => x.id === id);
  if (!o) return;
  // Sync with main site cart logic
  try {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    o.items.forEach((item) => {
      const existing = cart.find((c) => c.name === item.name);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + item.qty;
      } else {
        cart.push({
          name: item.name,
          price: item.price,
          image: item.img,
          quantity: item.qty,
        });
      }
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    syncCartCount();
  } catch (e) {
    /* silent */
  }
  toast(`Đã thêm ${o.items.length} sản phẩm vào giỏ hàng!`, "success");
  closeDetail();
}

function reviewOrder(id) {
  const o = orders.find((x) => x.id === id);
  if (!o) return;
  if (o.reviewed) {
    toast("Bạn đã đánh giá đơn hàng này rồi!", "info");
    return;
  }
  toast("Mở trang đánh giá sản phẩm...", "info");
  // window.location.href = `review.html?order=${id}`;
}

function trackOrder() {
  toast("Đang tải thông tin vận chuyển...", "info");
}

// ─── MODAL HELPERS ──────────────────────────
function showModal(id) {
  $(id).classList.add("show");
  document.body.style.overflow = "hidden";
}
function hideModal(id) {
  $(id).classList.remove("show");
  document.body.style.overflow = "";
}

// ─── BACK TO TOP ────────────────────────────
const backToTop = $("backToTop");
window.addEventListener("scroll", () => {
  backToTop.classList.toggle("show", window.scrollY > 300);
});
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ─── KEYBOARD SHORTCUT: ESC to close modals ─
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if ($("logoutConfirmBackdrop").classList.contains("show")) {
      closeLogoutConfirm();
    } else if ($("cancelBackdrop").classList.contains("show")) {
      hideModal("cancelBackdrop");
    } else if ($("modalBackdrop").classList.contains("show")) {
      closeDetail();
    }
  }
});

// ─── INIT ───────────────────────────────────
const currentUser = getCurrentUser();
if (!currentUser) {
  window.location.href = "signin.html";
} else {
  window.addEventListener("load", () => {
    initLogout();
    renderUserUI();
    syncCartCount();
    window.addEventListener("cartUpdated", syncCartCount);
    window.addEventListener("pageshow", syncCartCount);
    window.addEventListener("focus", syncCartCount);
    applyFilter();
    subscribeFirebaseOrders();
  });
}
