"use strict";
/* =============================================
   PHONESTORE – PROFILE PAGE  |  profile.js
   Full logic: edit info, avatar upload,
   address CRUD, password change, 2FA toggle,
   logout, navigation, stats, toast
   ============================================= */

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

function toast(msg, type = "success") {
  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    info: "fa-tag",
    warning: "fa-exclamation-circle",
  };
  const el = document.createElement("div");
  el.className = `oh-toast ${type}`;
  el.innerHTML = `<i class="fas ${icons[type]} oh-toast-icon"></i><span>${msg}</span>`;
  $("toastContainer").appendChild(el);
  setTimeout(() => {
    el.classList.add("hide");
    setTimeout(() => el.remove(), 320);
  }, 3200);
}

// ─────────────────────────────────────────────
//  USER DATA  (load / save localStorage)
// ─────────────────────────────────────────────
const DEFAULT_USER = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  phone: "0901 234 567",
  birthday: "1995-06-15",
  gender: "male",
  idCard: "079095001234",
  avatar: "",
  joined: "01/2025",
  twoFA: true,
};

const DEFAULT_ADDRESSES = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    phone: "0901 234 567",
    full: "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    type: "Nhà riêng",
    default: true,
  },
  {
    id: 2,
    name: "Nguyễn Văn A (Cơ quan)",
    phone: "0901 234 567",
    full: "740 Sư Vạn Hạnh, Phường 12, Quận 10, TP. Hồ Chí Minh",
    type: "Cơ quan",
    default: false,
  },
];

function loadUser() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser) return null;
  return {
    name:
      currentUser.name || currentUser.displayName || currentUser.fullName || "",
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    birthday: currentUser.birthday || "",
    gender: currentUser.gender || "",
    idCard: currentUser.idCard || "",
    avatar: currentUser.avatar || "",
    joined:
      currentUser.joined ||
      new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    memberTag: currentUser.memberTag || "",
    twoFA: typeof currentUser.twoFA === "boolean" ? currentUser.twoFA : true,
  };
}
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
}
function loadAddresses() {
  return JSON.parse(localStorage.getItem("ps_addrs") || "null") || [];
}
function getOrderStorageKey(userId = getCurrentUser()?.id) {
  return userId ? "ps_orders_" + userId : "ps_orders";
}
function loadOrders() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const scopedKey = getOrderStorageKey(currentUser.id);
  const scopedOrders = JSON.parse(localStorage.getItem(scopedKey) || "null");
  if (Array.isArray(scopedOrders)) return scopedOrders;

  const legacyOrders = JSON.parse(localStorage.getItem("ps_orders") || "[]");
  if (Array.isArray(legacyOrders) && legacyOrders.length > 0) {
    localStorage.setItem(scopedKey, JSON.stringify(legacyOrders));
    return legacyOrders;
  }

  return [];
}
function saveUser(u) {
  localStorage.setItem("ps_user", JSON.stringify(u));
}
function saveAddresses(a) {
  localStorage.setItem("ps_addrs", JSON.stringify(a));
}

let user = loadUser();
let addresses = loadAddresses();

function showLoggedOutState() {
  const wrapper = document.querySelector(".oh-wrapper");
  const prompt = $("notLoggedInPrompt");
  if (wrapper) wrapper.style.display = "none";
  if (prompt) prompt.style.display = "block";
  const logoutBtn = $("logoutBtn");
  if (logoutBtn) logoutBtn.style.display = "none";
}

function initProfilePage() {
  if (!user) {
    showLoggedOutState();
    return;
  }

  renderUserUI();
  renderAddresses();
  initAvatarUpload();
  initProfileForm();
  initTwoFA();
  initLogout();
  initBackToTop();
  initQuickNav();
  initButtons();
  syncCartCount();
  window.addEventListener("storage", (e) => {
    if (
      e.key === "currentUser" ||
      e.key === "cart" ||
      (e.key && e.key.startsWith("cart_")) ||
      e.key === null
    ) {
      syncCartCount();
    }
  });
  window.addEventListener("cartUpdated", syncCartCount);
  window.addEventListener("pageshow", syncCartCount);
  window.addEventListener("focus", syncCartCount);
}

// ─────────────────────────────────────────────
//  RENDER HERO & SIDEBAR
// ─────────────────────────────────────────────
function renderUserUI() {
  // Sidebar
  const avatarSrc =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=b7791f&color=fff&size=80&rounded=true`;
  const heroSrc =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=b7791f&color=fff&size=120&rounded=true`;

  if ($("sidebarAvatar")) $("sidebarAvatar").src = avatarSrc;
  if ($("sidebarName")) $("sidebarName").textContent = user.name;
  if ($("sidebarEmail")) $("sidebarEmail").textContent = user.email;
  if ($("heroAvatar")) $("heroAvatar").src = heroSrc;
  if ($("heroName")) $("heroName").textContent = user.name;
  if ($("heroEmail")) $("heroEmail").textContent = user.email;

  // Form fields
  if ($("pfName")) $("pfName").value = user.name;
  if ($("pfEmail")) $("pfEmail").value = user.email;
  if ($("pfPhone")) $("pfPhone").value = user.phone;
  if ($("pfBirthday")) $("pfBirthday").value = user.birthday;
  if ($("pfGender")) $("pfGender").value = user.gender;
  if ($("pfIdCard")) $("pfIdCard").value = user.idCard;

  // Stats from orders
  const orders = loadOrders();
  const totalSpent = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => {
      const sub = o.items.reduce((ss, i) => ss + i.price * i.qty, 0);
      return s + sub + (o.shipping || 0) - (o.discount || 0);
    }, 0);
  const orderCount = orders.length;
  const points = Math.round(totalSpent / 100000);

  const fmtSpent =
    totalSpent >= 1e9
      ? (totalSpent / 1e9).toFixed(1) + " tỷ"
      : totalSpent >= 1e6
        ? (totalSpent / 1e6).toFixed(1) + "M"
        : new Intl.NumberFormat("vi-VN").format(totalSpent);

  if ($("statOrders")) $("statOrders").textContent = orderCount || 7;
  if ($("statSpent"))
    $("statSpent").textContent = totalSpent ? fmtSpent : "162.3M";
  if ($("statPoints"))
    $("statPoints").textContent = points
      ? new Intl.NumberFormat("vi-VN").format(points)
      : "1,623";
  if ($("quickOrders")) $("quickOrders").textContent = orderCount || 7;

  // Joined tag
  const joinedTag = document.querySelector(".pf-tag.joined");
  if (joinedTag)
    joinedTag.innerHTML = `<i class="fas fa-calendar-check"></i> Tham gia: ${user.joined}`;
}

// ─────────────────────────────────────────────
//  AVATAR UPLOAD
// ─────────────────────────────────────────────
function initAvatarUpload() {
  const input = $("avatarInput");
  const heroAv = $("heroAvatar");
  const sideAv = $("sidebarAvatar");
  if (!input) return;

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      user.avatar = ev.target.result;
      saveUser(user);
      if (heroAv) heroAv.src = user.avatar;
      if (sideAv) sideAv.src = user.avatar;
      toast("Cập nhật ảnh đại diện thành công!", "success");
    };
    reader.readAsDataURL(file);
    input.value = "";
  });

  // Click on hero avatar triggers file picker
  if ($("heroAvatar")) {
    $("heroAvatar")
      .closest(".pf-hero-avatar")
      ?.addEventListener("click", (e) => {
        if (!e.target.closest("label")) input.click();
      });
  }
}

// ─────────────────────────────────────────────
//  EDIT PROFILE FORM
// ─────────────────────────────────────────────
let editMode = false;

function initProfileForm() {
  const btnEdit = $("btnEditInfo");
  const btnCancel = $("btnCancelEdit");
  const form = $("profileForm");
  const actions = $("formActions");
  const fields = form?.querySelectorAll("input, select");

  function enableEdit() {
    editMode = true;
    fields.forEach((f) => {
      f.disabled = false;
    });
    actions.style.display = "flex";
    btnEdit.innerHTML = '<i class="fas fa-times"></i> Hủy chỉnh sửa';
    btnEdit.style.background = "linear-gradient(45deg,#999,#666)";
  }

  function cancelEdit() {
    editMode = false;
    // restore original values
    $("pfName").value = user.name;
    $("pfEmail").value = user.email;
    $("pfPhone").value = user.phone;
    $("pfBirthday").value = user.birthday;
    $("pfGender").value = user.gender;
    $("pfIdCard").value = user.idCard;
    fields.forEach((f) => {
      f.disabled = true;
    });
    actions.style.display = "none";
    btnEdit.innerHTML = '<i class="fas fa-pen"></i> Chỉnh sửa';
    btnEdit.style.background = "";
  }

  if (btnEdit)
    btnEdit.addEventListener("click", () => {
      if (editMode) cancelEdit();
      else enableEdit();
    });
  if (btnCancel) btnCancel.addEventListener("click", cancelEdit);

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!editMode) return;

      // Validate
      const name = $("pfName").value.trim();
      const email = $("pfEmail").value.trim();
      const phone = $("pfPhone").value.trim();
      if (!name) {
        toast("Vui lòng nhập họ và tên!", "error");
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast("Email không hợp lệ!", "error");
        return;
      }
      if (!phone) {
        toast("Vui lòng nhập số điện thoại!", "error");
        return;
      }

      // Save
      user.name = name;
      user.email = email;
      user.phone = phone;
      user.birthday = $("pfBirthday").value;
      user.gender = $("pfGender").value;
      user.idCard = $("pfIdCard").value.trim();
      saveUser(user);

      // Also update currentUser so changes reflect globally
      const currentUserData = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      currentUserData.phone = phone;
      localStorage.setItem("currentUser", JSON.stringify(currentUserData));

      renderUserUI();
      cancelEdit();
      toast("Cập nhật thông tin thành công!", "success");
    });
  }
}

// ─────────────────────────────────────────────
//  ADDRESS LIST
// ─────────────────────────────────────────────
const ADDR_ICONS = {
  "Nhà riêng": "fa-home",
  "Cơ quan": "fa-briefcase",
  Khác: "fa-map-marker-alt",
};

function renderAddresses() {
  const list = $("addressList");
  if (!list) return;

  if (addresses.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--text-muted)">
        <i class="fas fa-map-marker-alt" style="font-size:2rem;opacity:.3;margin-bottom:10px;display:block"></i>
        Bạn chưa có địa chỉ nào. Thêm địa chỉ để giao hàng nhanh hơn!
      </div>`;
    return;
  }

  list.innerHTML = addresses
    .map(
      (addr) => `
  <div class="pf-address-card${addr.default ? " default" : ""}" data-id="${addr.id}">
    <div class="pf-address-icon">
      <i class="fas ${ADDR_ICONS[addr.type] || "fa-map-marker-alt"}"></i>
    </div>
    <div class="pf-address-body">
      <div class="pf-address-name">
        ${addr.name}
        ${addr.default ? '<span class="pf-default-badge"><i class="fas fa-star" style="font-size:9px"></i> Mặc định</span>' : ""}
        <span style="font-size:11.5px;color:var(--text-muted);background:var(--bg-page);border:1px solid var(--border);padding:2px 8px;border-radius:20px;font-weight:500">${addr.type}</span>
      </div>
      <div class="pf-address-phone"><i class="fas fa-phone" style="font-size:11px;color:var(--gold-light);margin-right:4px"></i>${addr.phone}</div>
      <div class="pf-address-full">${addr.full}</div>
    </div>
    <div class="pf-address-actions">
      <button class="pf-btn-outline" onclick="openAddressModal(${addr.id})"><i class="fas fa-pen"></i> Sửa</button>
      ${!addr.default ? `<button class="pf-btn-outline" onclick="setDefaultAddress(${addr.id})"><i class="fas fa-check"></i> Mặc định</button>` : ""}
      ${!addr.default ? `<button class="pf-btn-outline danger" onclick="deleteAddress(${addr.id})"><i class="fas fa-trash"></i></button>` : ""}
    </div>
  </div>`,
    )
    .join("");
}

function setDefaultAddress(id) {
  addresses.forEach((a) => {
    a.default = a.id === id;
  });
  saveAddresses(addresses);
  renderAddresses();
  toast("Đã đặt địa chỉ mặc định!", "success");
}

function deleteAddress(id) {
  if (!confirm("Xóa địa chỉ này?")) return;
  addresses = addresses.filter((a) => a.id !== id);
  saveAddresses(addresses);
  renderAddresses();
  toast("Đã xóa địa chỉ!", "info");
}

// ── Add / Edit Address Modal ──
function buildAddressModal() {
  if ($("addressModal")) return; // already built
  const m = document.createElement("div");
  m.id = "addressModalBackdrop";
  m.className = "modal-backdrop";
  m.innerHTML = `
  <div class="order-modal" style="max-width:520px">
    <div class="modal-header">
      <div class="modal-header-left">
        <h3 id="addrModalTitle"><i class="fas fa-map-marker-alt"></i> Thêm địa chỉ mới</h3>
      </div>
      <button class="modal-close-btn" id="addrModalClose"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body" style="gap:14px">
      <input type="hidden" id="addrId">
      <div class="pf-form-grid" style="grid-template-columns:1fr 1fr;gap:14px">
        <div class="pf-field">
          <label><i class="fas fa-user"></i> Họ và tên *</label>
          <input type="text" class="pf-field-input" id="addrName" placeholder="Nguyễn Văn A" style="padding:10px 14px;background:var(--bg-page);border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13.5px;font-family:inherit;color:var(--text-dark);outline:none">
        </div>
        <div class="pf-field">
          <label><i class="fas fa-phone"></i> Số điện thoại *</label>
          <input type="text" class="pf-field-input" id="addrPhone" placeholder="0901 234 567" style="padding:10px 14px;background:var(--bg-page);border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13.5px;font-family:inherit;color:var(--text-dark);outline:none">
        </div>
      </div>
      <div class="pf-field" style="display:flex;flex-direction:column;gap:6px">
        <label><i class="fas fa-map-marker-alt"></i> Địa chỉ đầy đủ *</label>
        <input type="text" class="pf-field-input" id="addrFull" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" style="padding:10px 14px;background:var(--bg-page);border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13.5px;font-family:inherit;color:var(--text-dark);outline:none">
      </div>
      <div class="pf-field" style="display:flex;flex-direction:column;gap:6px">
        <label><i class="fas fa-tag"></i> Loại địa chỉ</label>
        <select id="addrType" style="padding:10px 14px;background:var(--bg-page);border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13.5px;font-family:inherit;color:var(--text-dark);outline:none;appearance:none">
          <option>Nhà riêng</option>
          <option>Cơ quan</option>
          <option>Khác</option>
        </select>
      </div>
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13.5px;color:var(--text-mid);font-weight:500;padding:10px 14px;background:var(--gold-pale);border-radius:var(--radius-sm);border:1px solid var(--gold-border)">
        <input type="checkbox" id="addrDefault" style="accent-color:var(--gold-primary);width:16px;height:16px">
        Đặt làm địa chỉ mặc định
      </label>
    </div>
    <div class="modal-footer">
      <button class="btn-cancel-no" id="addrCancelBtn">Hủy</button>
      <button class="btn-view-detail" id="addrSaveBtn"><i class="fas fa-check"></i> Lưu địa chỉ</button>
    </div>
  </div>`;
  document.body.appendChild(m);

  $("addrModalClose").onclick = () => closeAddrModal();
  $("addrCancelBtn").onclick = () => closeAddrModal();
  m.addEventListener("click", (e) => {
    if (e.target === m) closeAddrModal();
  });

  // Focus style
  m.querySelectorAll(".pf-field-input, #addrType").forEach((inp) => {
    inp.addEventListener("focus", () => {
      inp.style.borderColor = "var(--gold-primary)";
      inp.style.boxShadow = "0 0 0 3px rgba(183,121,31,.1)";
    });
    inp.addEventListener("blur", () => {
      inp.style.borderColor = "var(--border)";
      inp.style.boxShadow = "";
    });
  });

  $("addrSaveBtn").onclick = saveAddress;
}

function openAddressModal(id = null) {
  buildAddressModal();
  const backdrop = $("addressModalBackdrop");
  if (id) {
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    $("addrModalTitle").innerHTML =
      '<i class="fas fa-map-marker-alt"></i> Chỉnh sửa địa chỉ';
    $("addrId").value = addr.id;
    $("addrName").value = addr.name;
    $("addrPhone").value = addr.phone;
    $("addrFull").value = addr.full;
    $("addrType").value = addr.type;
    $("addrDefault").checked = addr.default;
  } else {
    $("addrModalTitle").innerHTML =
      '<i class="fas fa-map-marker-alt"></i> Thêm địa chỉ mới';
    $("addrId").value = "";
    $("addrName").value = user.name;
    $("addrPhone").value = user.phone;
    $("addrFull").value = $("addrType").value = "";
    $("addrDefault").checked = addresses.length === 0;
  }
  backdrop.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeAddrModal() {
  const backdrop = $("addressModalBackdrop");
  if (backdrop) {
    backdrop.classList.remove("show");
    document.body.style.overflow = "";
  }
}

function saveAddress() {
  const name = $("addrName").value.trim();
  const phone = $("addrPhone").value.trim();
  const full = $("addrFull").value.trim();
  const type = $("addrType").value;
  const isDef = $("addrDefault").checked;
  const editId = $("addrId").value;

  if (!name) {
    toast("Vui lòng nhập họ tên!", "error");
    return;
  }
  if (!phone) {
    toast("Vui lòng nhập số điện thoại!", "error");
    return;
  }
  if (!full) {
    toast("Vui lòng nhập địa chỉ!", "error");
    return;
  }

  if (isDef)
    addresses.forEach((a) => {
      a.default = false;
    });

  if (editId) {
    const addr = addresses.find((a) => a.id === parseInt(editId));
    if (addr) {
      addr.name = name;
      addr.phone = phone;
      addr.full = full;
      addr.type = type;
      addr.default = isDef;
    }
    toast("Cập nhật địa chỉ thành công!", "success");
  } else {
    const newId = addresses.length
      ? Math.max(...addresses.map((a) => a.id)) + 1
      : 1;
    addresses.push({ id: newId, name, phone, full, type, default: isDef });
    toast("Thêm địa chỉ thành công!", "success");
  }

  saveAddresses(addresses);
  renderAddresses();
  closeAddrModal();
}

// ─────────────────────────────────────────────
//  PASSWORD CHANGE MODAL
// ─────────────────────────────────────────────
function buildPasswordModal() {
  if ($("pwdModalBackdrop")) return;
  const m = document.createElement("div");
  m.id = "pwdModalBackdrop";
  m.className = "modal-backdrop";
  m.innerHTML = `
  <div class="order-modal" style="max-width:420px">
    <div class="modal-header">
      <div class="modal-header-left"><h3><i class="fas fa-lock"></i> Đổi mật khẩu</h3></div>
      <button class="modal-close-btn" id="pwdModalClose"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body" style="gap:14px">
      ${[
        "pwdCurrent:Mật khẩu hiện tại:fa-lock",
        "pwdNew:Mật khẩu mới:fa-key",
        "pwdConfirm:Xác nhận mật khẩu mới:fa-check-circle",
      ]
        .map((f) => {
          const [id, lbl, icon] = f.split(":");
          return `
        <div class="pf-field" style="display:flex;flex-direction:column;gap:6px">
          <label><i class="fas ${icon}"></i> ${lbl}</label>
          <div style="position:relative">
            <input type="password" id="${id}" placeholder="••••••••"
              style="width:100%;padding:10px 44px 10px 14px;background:var(--bg-page);border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13.5px;font-family:inherit;color:var(--text-dark);outline:none">
            <button type="button" class="pwd-eye" data-target="${id}"
              style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px;padding:0">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>`;
        })
        .join("")}
      <div id="pwdStrengthWrap" style="display:none">
        <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:5px">Độ mạnh mật khẩu: <span id="pwdStrengthLabel">Yếu</span></div>
        <div style="display:flex;gap:3px">
          ${[1, 2, 3, 4].map((i) => `<div class="pwd-bar" data-n="${i}" style="flex:1;height:4px;border-radius:2px;background:var(--border);transition:background .3s"></div>`).join("")}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-cancel-no" id="pwdCancelBtn">Hủy</button>
      <button class="btn-view-detail" id="pwdSaveBtn"><i class="fas fa-check"></i> Đổi mật khẩu</button>
    </div>
  </div>`;
  document.body.appendChild(m);

  $("pwdModalClose").onclick = () => closePwdModal();
  $("pwdCancelBtn").onclick = () => closePwdModal();
  m.addEventListener("click", (e) => {
    if (e.target === m) closePwdModal();
  });

  // Focus border
  m.querySelectorAll('input[type="password"]').forEach((inp) => {
    inp.addEventListener("focus", () => {
      inp.style.borderColor = "var(--gold-primary)";
      inp.style.boxShadow = "0 0 0 3px rgba(183,121,31,.1)";
    });
    inp.addEventListener("blur", () => {
      inp.style.borderColor = "var(--border)";
      inp.style.boxShadow = "";
    });
  });

  // Show/hide password
  m.querySelectorAll(".pwd-eye").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inp = $(btn.dataset.target);
      const isPass = inp.type === "password";
      inp.type = isPass ? "text" : "password";
      btn.querySelector("i").className = `fas fa-eye${isPass ? "-slash" : ""}`;
    });
  });

  // Password strength
  $("pwdNew").addEventListener("input", () => {
    const val = $("pwdNew").value;
    $("pwdStrengthWrap").style.display = val ? "block" : "none";
    const lvl = !val
      ? 0
      : val.length < 6
        ? 1
        : val.length < 10
          ? 2
          : /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)
            ? 4
            : 3;
    const colors = ["", "#ef4444", "#f97316", "#f59e0b", "#28a745"];
    const labels = ["", "Rất yếu", "Yếu", "Trung bình", "Mạnh"];
    m.querySelectorAll(".pwd-bar").forEach((bar) => {
      const n = parseInt(bar.dataset.n);
      bar.style.background = n <= lvl ? colors[lvl] : "var(--border)";
    });
    $("pwdStrengthLabel").textContent = labels[lvl] || "";
    $("pwdStrengthLabel").style.color = colors[lvl] || "var(--text-muted)";
  });

  $("pwdSaveBtn").addEventListener("click", doChangePassword);
}

function openPasswordModal() {
  buildPasswordModal();
  ["pwdCurrent", "pwdNew", "pwdConfirm"].forEach((id) => {
    $(id).value = "";
    $(id).type = "password";
  });
  $("pwdStrengthWrap").style.display = "none";
  $("pwdModalBackdrop").classList.add("show");
  document.body.style.overflow = "hidden";
}

function closePwdModal() {
  $("pwdModalBackdrop").classList.remove("show");
  document.body.style.overflow = "";
}

function doChangePassword() {
  const cur = $("pwdCurrent").value;
  const nw = $("pwdNew").value;
  const cf = $("pwdConfirm").value;
  if (!cur) {
    toast("Nhập mật khẩu hiện tại!", "error");
    return;
  }
  if (nw.length < 8) {
    toast("Mật khẩu mới phải có ít nhất 8 ký tự!", "error");
    return;
  }
  if (nw !== cf) {
    toast("Xác nhận mật khẩu không khớp!", "error");
    return;
  }
  // In a real app, verify `cur` against stored hash.
  closePwdModal();
  toast("Đổi mật khẩu thành công!", "success");
}

// ─────────────────────────────────────────────
//  2FA TOGGLE
// ─────────────────────────────────────────────
function initTwoFA() {
  // The "Quản lý" button next to 2FA
  const btns = document.querySelectorAll(".pf-btn-outline");
  btns.forEach((btn) => {
    const row = btn.closest(".pf-security-item");
    if (!row) return;
    const title = row.querySelector("h4")?.textContent || "";
    if (!title.includes("2FA")) return;
    btn.addEventListener("click", () => {
      const statusEl = row.querySelector(".pf-status-on");
      if (user.twoFA) {
        if (
          confirm("Tắt xác thực 2 lớp sẽ giảm bảo mật tài khoản. Tiếp tục?")
        ) {
          user.twoFA = false;
          saveUser(user);
          if (statusEl) {
            statusEl.innerHTML =
              '<i class="fas fa-times-circle" style="color:var(--danger)"></i> Đã tắt';
            statusEl.style.color = "var(--danger)";
          }
          toast("Đã tắt xác thực 2 lớp!", "warning");
        }
      } else {
        user.twoFA = true;
        saveUser(user);
        if (statusEl) {
          statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Đang bật';
          statusEl.style.color = "";
          statusEl.className = "pf-status-on";
        }
        toast("Đã bật xác thực 2 lớp!", "success");
      }
    });
  });
}

// ─────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────
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

async function performLogout() {
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
  window.dispatchEvent(new CustomEvent("userLoggedOut"));
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
    await performLogout();
    closeLogoutConfirm();
    toast("Đã đăng xuất. Đang chuyển hướng đến đăng nhập...", "info");
    setTimeout(() => {
      window.location.replace("signin.html");
    }, 1200);
  });
}

// ─────────────────────────────────────────────
//  CART COUNT (sync header)
// ─────────────────────────────────────────────
function syncCartCount() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const key = currentUser ? `cart_${currentUser.id}` : "cart";

  let cart = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    cart = Array.isArray(parsed) ? parsed : [];
  } catch {
    cart = [];
  }

  if (currentUser && cart.length === 0) {
    try {
      const legacyParsed = JSON.parse(localStorage.getItem("cart") || "[]");
      const legacyCart = Array.isArray(legacyParsed) ? legacyParsed : [];
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
    } catch {
      // ignore invalid legacy cart
    }
  }

  const count = cart.reduce(
    (s, item) => s + (item.quantity || item.qty || 1),
    0,
  );
  document.querySelectorAll("#cartCount, .cart-count").forEach((el) => {
    el.textContent = String(count);
  });
}

// ─────────────────────────────────────────────
//  BACK TO TOP
// ─────────────────────────────────────────────
function initBackToTop() {
  const btn = $("backToTop");
  if (!btn) return;
  window.addEventListener("scroll", () =>
    btn.classList.toggle("show", window.scrollY > 300),
  );
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

// ─────────────────────────────────────────────
//  QUICK CARDS  (navigation)
// ─────────────────────────────────────────────
function initQuickNav() {
  // Already using <a href> links in HTML — nothing extra needed.
  // Highlight current page on sidebar
  const currentPage = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".snav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (
      href &&
      href !== "#" &&
      currentPage.includes(href.replace(".html", ""))
    ) {
      link.classList.add("active");
    }
  });
}

// ─────────────────────────────────────────────
//  WIRE UP STATIC BUTTONS
// ─────────────────────────────────────────────
function initButtons() {
  // "Thêm mới" address
  const btnAddAddr = $("btnAddAddress");
  if (btnAddAddr)
    btnAddAddr.addEventListener("click", () => openAddressModal());

  // "Đổi mật khẩu"
  const btnChangePwd = $("btnChangePass");
  if (btnChangePwd) btnChangePwd.addEventListener("click", openPasswordModal);
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initProfilePage);
