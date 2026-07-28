// ========== PROFILE AREA UI MANAGEMENT ==========

let isOutsideClickBound = false;

document.addEventListener("DOMContentLoaded", () => {
  setupProfileArea();
});

window.addEventListener("userLoggedIn", () => {
  setupProfileArea();
});

window.addEventListener("userLoggedOut", () => {
  setupProfileArea();
});

window.addEventListener("storage", (event) => {
  if (event.key === "currentUser") {
    setupProfileArea();
  }
});

window.addEventListener("pageshow", () => {
  setupProfileArea();
});

function clearFirebaseAuthCache() {
  const prefixes = ["firebase:authUser:", "firebase:host:"];
  [localStorage, sessionStorage].forEach((storage) => {
    const keys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        keys.push(key);
      }
    }

    keys.forEach((key) => storage.removeItem(key));
  });
}

function showLogoutNotice() {
  const message = "Đã đăng xuất. Đang chuyển hướng đến đăng nhập...";

  if (typeof window.toast === "function") {
    window.toast(message, "info");
    return;
  }

  const existingToast = document.getElementById("psHeaderLogoutToast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.id = "psHeaderLogoutToast";
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.right = "20px";
  toast.style.bottom = "20px";
  toast.style.zIndex = "99999";
  toast.style.background = "#2c1810";
  toast.style.color = "#fff";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
  toast.style.fontSize = "14px";
  toast.style.maxWidth = "320px";
  toast.style.lineHeight = "1.4";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 1300);
}

function ensureHeaderLogoutConfirmModal() {
  if (document.getElementById("psHeaderLogoutConfirmBackdrop")) {
    return;
  }

  if (!document.getElementById("psHeaderLogoutConfirmStyle")) {
    const style = document.createElement("style");
    style.id = "psHeaderLogoutConfirmStyle";
    style.textContent = `
      .ps-confirm-backdrop {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.75);
        z-index: 9999;
        padding: 16px;
      }

      .ps-confirm-backdrop.show {
        display: flex;
      }

      .ps-confirm-modal {
        width: min(520px, calc(100% - 40px));
        background: #ffffff;
        border-radius: 24px;
        padding: 28px 24px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.16);
        text-align: center;
        color: #111827;
      }

      .ps-confirm-modal h3 {
        margin: 0 0 12px;
        font-size: 1.35rem;
      }

      .ps-confirm-modal p {
        margin: 0 0 24px;
        color: #475569;
        line-height: 1.7;
      }

      .ps-confirm-actions {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .ps-confirm-actions button {
        min-width: 120px;
        padding: 12px 18px;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        transition: transform 0.2s ease;
        font-family: inherit;
      }

      .ps-confirm-actions button:hover {
        transform: translateY(-1px);
      }

      .ps-confirm-actions .cancel {
        background: #f3f4f6;
        color: #111827;
      }

      .ps-confirm-actions .confirm {
        background: linear-gradient(135deg, #f8d569, #d19c31);
        color: #111827;
        box-shadow: 0 8px 16px rgba(209, 156, 49, 0.25);
      }

      .ps-confirm-actions .confirm:hover {
        background: linear-gradient(135deg, #fadd8a, #c78725);
      }
    `;
    document.head.appendChild(style);
  }

  const backdrop = document.createElement("div");
  backdrop.className = "ps-confirm-backdrop";
  backdrop.id = "psHeaderLogoutConfirmBackdrop";
  backdrop.innerHTML = `
    <div class="ps-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="psHeaderLogoutConfirmTitle">
      <h3 id="psHeaderLogoutConfirmTitle">Xác nhận đăng xuất</h3>
      <p>Bạn có chắc muốn đăng xuất không? Chọn “Có” để thoát tài khoản.</p>
      <div class="ps-confirm-actions">
        <button type="button" class="cancel" id="psHeaderLogoutCancelBtn">Không</button>
        <button type="button" class="confirm" id="psHeaderLogoutConfirmBtn">Có, đăng xuất</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
}

function showHeaderLogoutConfirmModal() {
  ensureHeaderLogoutConfirmModal();

  const backdrop = document.getElementById("psHeaderLogoutConfirmBackdrop");
  const cancelBtn = document.getElementById("psHeaderLogoutCancelBtn");
  const confirmBtn = document.getElementById("psHeaderLogoutConfirmBtn");
  if (!backdrop || !cancelBtn || !confirmBtn) {
    return Promise.resolve(false);
  }

  backdrop.classList.add("show");
  document.body.style.overflow = "hidden";

  return new Promise((resolve) => {
    const close = (result) => {
      backdrop.classList.remove("show");
      document.body.style.overflow = "";
      backdrop.removeEventListener("click", handleBackdropClick);
      cancelBtn.removeEventListener("click", handleCancel);
      confirmBtn.removeEventListener("click", handleConfirm);
      document.removeEventListener("keydown", handleKeydown);
      resolve(result);
    };

    const handleBackdropClick = (event) => {
      if (event.target === backdrop) {
        close(false);
      }
    };

    const handleCancel = () => close(false);
    const handleConfirm = () => close(true);
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        close(false);
      }
    };

    backdrop.addEventListener("click", handleBackdropClick);
    cancelBtn.addEventListener("click", handleCancel);
    confirmBtn.addEventListener("click", handleConfirm);
    document.addEventListener("keydown", handleKeydown);
  });
}

async function performLogout() {
  localStorage.setItem("ps_force_logout", "1");

  if (window.googleAuth && typeof window.googleAuth.logout === "function") {
    try {
      await window.googleAuth.logout();
    } catch (error) {
      console.warn(
        "Google auth logout failed, fallback to Firebase signOut:",
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
        "Firebase signOut failed, fallback to local cleanup:",
        error,
      );
    }
  }

  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("googleUserData");
  clearFirebaseAuthCache();
  window.dispatchEvent(new CustomEvent("userLoggedOut"));
}

function setupProfileArea() {
  const profileArea = document.querySelector(".profile-area");
  if (!profileArea) return;

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    currentUser = null;
  }

  const profileTrigger = profileArea.querySelector(".profile-trigger");
  const profileDropdown = profileArea.querySelector(".profile-dropdown");
  const profileName = profileArea.querySelector(".profile-name");
  const profileAvatar = profileArea.querySelector(".profile-avatar");
  const loginBtn = profileArea.querySelector(".login-btn");
  const logoutBtn = profileArea.querySelector(".logout-btn");

  if (
    !profileTrigger ||
    !profileDropdown ||
    !profileName ||
    !profileAvatar ||
    !loginBtn
  ) {
    return;
  }

  if (!isOutsideClickBound) {
    document.addEventListener("click", (e) => {
      const activeProfileArea = document.querySelector(".profile-area");
      if (!activeProfileArea) return;
      const activeTrigger = activeProfileArea.querySelector(".profile-trigger");
      const activeDropdown =
        activeProfileArea.querySelector(".profile-dropdown");
      if (!activeTrigger || !activeDropdown) return;

      if (!activeProfileArea.contains(e.target)) {
        activeTrigger.classList.remove("active");
        activeDropdown.style.display = "none";
      }
    });
    isOutsideClickBound = true;
  }

  // Check login status and update UI
  if (currentUser) {
    // User is logged in
    profileName.textContent =
      currentUser.displayName ||
      currentUser.fullName ||
      currentUser.name ||
      "User";
    profileName.style.display = "block";
    profileTrigger.style.display = "flex";
    profileDropdown.style.display = "none";
    loginBtn.style.display = "none";

    // Update avatar if available
    if (currentUser.avatar) {
      profileAvatar.src = currentUser.avatar;
    } else {
      const userName =
        currentUser.displayName ||
        currentUser.fullName ||
        currentUser.name ||
        "User";
      profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=b7791f&color=fff&size=40&rounded=true`;
    }

    // Setup dropdown toggle
    profileTrigger.onclick = (e) => {
      e.stopPropagation();
      profileTrigger.classList.toggle("active");
      profileDropdown.style.display =
        profileDropdown.style.display === "none" ? "block" : "none";
    };

    // Setup logout
    if (logoutBtn) {
      logoutBtn.onclick = async (e) => {
        e.preventDefault();

        profileTrigger.classList.remove("active");
        profileDropdown.style.display = "none";

        const shouldLogout = await showHeaderLogoutConfirmModal();
        if (!shouldLogout) return;

        performLogout().finally(() => {
          showLogoutNotice();
          setTimeout(() => {
            window.location.replace("signin.html");
          }, 1200);
        });
      };
    }
  } else {
    // User is not logged in
    profileName.style.display = "none";
    profileTrigger.style.display = "none";
    profileDropdown.style.display = "none";
    loginBtn.style.display = "block";

    // Setup trigger to redirect to login
    profileTrigger.onclick = () => {
      window.location.href = "signin.html";
    };

    if (logoutBtn) {
      logoutBtn.onclick = null;
    }
  }
}
