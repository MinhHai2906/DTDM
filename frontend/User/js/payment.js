"use strict";

const PAYMENT_COLLECTION = "orders";
const PAYMENT_CACHE_KEY = "checkoutOrder";
const STATUS_PENDING = "Chờ xác nhận";
const CASH_PAYMENT_VALUE = "cod";
const CASH_PAYMENT_LABEL = "Tiền mặt khi nhận hàng";

const $ = (id) => document.getElementById(id);
const fmt = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + "đ";
const nowIso = () => new Date().toISOString();

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
}

function getCartKey(userId) {
  return userId ? `cart_${userId}` : "cart";
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

function waitForAuthUser(auth, timeoutMs = 5000) {
  if (auth?.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise((resolve) => {
    let unsubscribe = () => {};
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, timeoutMs);

    unsubscribe = auth.onAuthStateChanged((user) => {
      clearTimeout(timer);
      unsubscribe();
      resolve(user || null);
    });
  });
}

function getResolvedUserId(currentUser, authUser) {
  return authUser?.uid || currentUser?.id || currentUser?.uid || "";
}

function getCheckoutPayload() {
  const raw = localStorage.getItem(PAYMENT_CACHE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

function clearCart(userId) {
  const cartKey = getCartKey(userId);
  localStorage.setItem(cartKey, "[]");
  if (localStorage.getItem("cart")) {
    localStorage.setItem("cart", "[]");
  }
  window.dispatchEvent(new Event("cartUpdated"));
}

function showToast(message, type = "success") {
  const existing = document.querySelector(".payment-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "payment-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(
    () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 240);
    },
    type === "error" ? 4200 : 2800,
  );
}

function resolvePaymentMethod() {
  return CASH_PAYMENT_LABEL;
}

function resolvePaymentStatus() {
  return "Chờ xác nhận";
}

function resolveAddressText(formData) {
  return formData.address;
}

function renderPaymentItems(items) {
  $("paymentItems").innerHTML = items
    .map(
      (item) => `
      <div class="payment-item">
        <img src="${item.image || item.img || "https://placehold.co/120x120/f8eee0/b7791f?text=SP"}" alt="${item.name}">
        <div>
          <h4>${item.name}</h4>
          <p>Số lượng: ${item.quantity || item.qty || 1}</p>
        </div>
        <strong>${fmt((Number(item.price) || 0) * (Number(item.quantity || item.qty) || 1))}</strong>
      </div>
    `,
    )
    .join("");
}

function renderOrderSummary(payload) {
  const subtotal = Number(payload.subtotal) || 0;
  const discount = Number(payload.discount) || 0;
  const shipping = Number(payload.shipping) || 0;
  const total =
    Number(payload.total) || Math.max(0, subtotal - discount + shipping);

  $("sumSubtotal").textContent = fmt(subtotal);
  $("sumDiscount").textContent = `-${fmt(discount)}`;
  $("sumShipping").textContent = shipping === 0 ? "Miễn phí" : fmt(shipping);
  $("sumTotal").textContent = fmt(total);
}

function prefillForm(currentUser, payload) {
  $("fullName").value = currentUser?.name || currentUser?.displayName || "";
  $("email").value = currentUser?.email || "";
  $("phone").value = currentUser?.phone || "";

  // Load saved addresses and get default one
  const savedAddresses = JSON.parse(localStorage.getItem("ps_addrs") || "[]");
  const defaultAddress = savedAddresses.find((a) => a.default);
  if (defaultAddress && defaultAddress.full) {
    $("address").value = defaultAddress.full;
  }

  if (payload?.form) {
    $("fullName").value = payload.form.fullName || $("fullName").value;
    $("email").value = payload.form.email || $("email").value;
    $("phone").value = payload.form.phone || $("phone").value;
    $("address").value = payload.form.address || $("address").value;
    $("note").value = payload.form.note || "";
    $("paymentMethod").value = CASH_PAYMENT_VALUE;
  }

  $("paymentMethod").value = CASH_PAYMENT_VALUE;
}

function renderEmptyState(message) {
  $("paymentEmpty").style.display = "block";
  $("paymentEmpty").innerHTML = `
    <h3>Không có đơn hàng chờ thanh toán</h3>
    <p>${message}</p>
    <p><a href="cart.html">Quay lại giỏ hàng</a></p>
  `;
  $("paymentContent").style.display = "none";
}

async function submitOrder(event) {
  event.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "signin.html?from=payment";
    return;
  }

  const payload = getCheckoutPayload();
  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    showToast("Không tìm thấy dữ liệu đơn hàng cần thanh toán.", "error");
    return;
  }

  const formData = {
    fullName: $("fullName").value.trim(),
    phone: $("phone").value.trim(),
    email: $("email").value.trim(),
    address: $("address").value.trim(),
    note: $("note").value.trim(),
    paymentMethod: CASH_PAYMENT_VALUE,
  };

  if (
    !formData.fullName ||
    !formData.phone ||
    !formData.email ||
    !formData.address
  ) {
    showToast("Vui lòng nhập đầy đủ thông tin nhận hàng.", "error");
    return;
  }

  const paymentMethodLabel = resolvePaymentMethod(formData.paymentMethod);
  const paymentStatus = resolvePaymentStatus(formData.paymentMethod);
  const orderId = `DH-${Date.now()}`;
  const shipping = Number(payload.shipping) || 0;
  const discount = Number(payload.discount) || 0;
  const subtotal = Number(payload.subtotal) || 0;
  const total =
    Number(payload.total) || Math.max(0, subtotal - discount + shipping);
  const addressText = resolveAddressText(formData);
  let db;
  let authUser;
  let resolvedUserId = "";

  try {
    const firebaseCtx = await waitForFirebase();
    db = firebaseCtx.db;
    authUser = await waitForAuthUser(firebaseCtx.auth);
    resolvedUserId = getResolvedUserId(currentUser, authUser);
  } catch (error) {
    console.error("Firebase not ready for payment:", error);
    showToast(
      "Hệ thống Firebase chưa sẵn sàng. Vui lòng thử lại sau ít phút.",
      "error",
    );
    return;
  }

  if (!authUser || !resolvedUserId) {
    showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
    setTimeout(() => {
      window.location.href = "signin.html?from=payment";
    }, 700);
    return;
  }

  if (!currentUser || currentUser.id !== resolvedUserId) {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        ...(currentUser || {}),
        id: resolvedUserId,
      }),
    );
  }

  const order = {
    id: orderId,
    orderCode: orderId,
    userId: resolvedUserId,
    date: new Date().toISOString().split("T")[0],
    customer: formData.fullName,
    name: formData.fullName,
    phone: formData.phone,
    email: formData.email,
    address: addressText,
    addressText,
    note: formData.note,
    items: payload.items.map((item) => ({
      name: item.name,
      qty: Number(item.quantity || item.qty) || 1,
      price: Number(item.price) || 0,
      img: item.image || item.img || "",
      variant: item.variant || "",
    })),
    subtotal,
    discount,
    shipping,
    total,
    status: STATUS_PENDING,
    payment: {
      method: paymentMethodLabel,
      status: paymentStatus,
    },
    paymentMethod: paymentMethodLabel,
    paymentStatus,
    discountCode: payload.discountCode || "",
    discountPercent: Number(payload.discountPercent) || 0,
    timeline: [
      {
        step: "Đặt hàng",
        time: nowIso(),
        done: true,
        current: true,
      },
    ],
    noteCreatedAt: nowIso(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection(PAYMENT_COLLECTION).doc(orderId).set(order);

    localStorage.removeItem(PAYMENT_CACHE_KEY);
    showToast("Đặt hàng thành công. Đang chuyển tới lịch sử đơn hàng...");

    setTimeout(() => {
      window.location.href = "order-history.html";
    }, 1200);
  } catch (error) {
    console.error("Payment submit failed:", error);
    if (error?.code === "permission-denied") {
      showToast(
        "Bạn chưa có quyền tạo đơn hàng. Vui lòng đăng nhập lại tài khoản user.",
        "error",
      );
      return;
    }

    showToast(
      "Không thể lưu đơn hàng lên Firebase. Vui lòng thử lại.",
      "error",
    );
  }
}

function initPaymentPage() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "signin.html?from=payment";
    return;
  }

  const payload = getCheckoutPayload();
  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    renderEmptyState("Giỏ hàng của bạn chưa có dữ liệu thanh toán.");
    return;
  }

  renderPaymentItems(payload.items);
  renderOrderSummary(payload);
  prefillForm(currentUser, payload);

  $("paymentContent").style.display = "grid";
  $("paymentEmpty").style.display = "none";
  $("paymentForm").addEventListener("submit", submitOrder);
}

document.addEventListener("DOMContentLoaded", initPaymentPage);
