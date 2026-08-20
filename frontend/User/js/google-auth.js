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

const FORCE_LOGOUT_KEY = "ps_force_logout";

function markForceLogout() {
  localStorage.setItem(FORCE_LOGOUT_KEY, "1");
}

function clearForceLogout() {
  localStorage.removeItem(FORCE_LOGOUT_KEY);
}

class GoogleAuthManager {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
  }

  normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  normalizePhone(phone) {
    return (phone || "").replace(/[^\d]/g, "");
  }

  async initialize() {
    if (!window.firebaseAuth || !window.googleProvider) {
      throw new Error("Firebase Authentication chưa được khởi tạo.");
    }

    this.isInitialized = true;
    return true;
  }

  renderSignInButton(elementId, mode = "signin") {
    const button = document.getElementById("googleSignInBtn");
    if (!button) return;

    button.type = "button";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await this.signInWithGoogle();
      } catch (error) {
        console.error("Google sign-in failed:", error);
        const message = this.translateAuthError(error);
        if (typeof window.showError === "function") {
          window.showError(message);
        } else {
          alert(message);
        }
      } finally {
        button.disabled = false;
      }
    });
  }

  async signInWithGoogle() {
    await this.initialize();

    const result = await window.firebaseAuth.signInWithPopup(window.googleProvider);
    const firebaseUser = result.user;
    const token = await firebaseUser.getIdToken();
    const userData = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
      email: firebaseUser.email,
      avatar: firebaseUser.photoURL || "",
      authProvider: "google",
      joined: new Date().toLocaleDateString("vi-VN"),
      token,
    };

    localStorage.setItem("currentUser", JSON.stringify(userData));
    sessionStorage.setItem("googleUserData", JSON.stringify(userData));
    this.currentUser = userData;
    window.location.href = "index.html";
    return userData;
  }

  translateAuthError(error) {
    const messages = {
      "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập Google.",
      "auth/popup-blocked": "Trình duyệt đã chặn popup. Hãy cho phép popup cho trang này rồi thử lại.",
      "auth/operation-not-allowed": "Google Sign-In chưa được bật trong Firebase Console.",
      "auth/unauthorized-domain": `Tên miền ${window.location.hostname} chưa được thêm vào Authorized domains của Firebase.`,
      "auth/network-request-failed": "Không thể kết nối Firebase. Hãy kiểm tra mạng rồi thử lại.",
    };
    return messages[error?.code] || error?.message || "Đăng nhập Google thất bại.";
  }

  async signInWithEmailPassword(email, password) {
    const normalizedEmail = this.normalizeEmail(email);
    const response = await fetch("https://phonestore-backend-yt5q.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Đăng nhập thất bại.");
    }

    const userData = {
      id: data.uid,
      uid: data.uid,
      name: data.displayName || data.email.split("@")[0],
      email: data.email,
      authProvider: "email",
      joined: new Date().toLocaleDateString("vi-VN"),
      token: data.idToken,
    };

    localStorage.setItem("currentUser", JSON.stringify(userData));
    this.currentUser = userData;
    return userData;
  }

  async registerWithEmailPassword(email, password, displayName, phone) {
    const normalizedEmail = this.normalizeEmail(email);
    const cleanDisplayName = (displayName || "").trim();
    const cleanPhone = (phone || "").trim();

    const response = await fetch("https://phonestore-backend-yt5q.onrender.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        displayName: cleanDisplayName || normalizedEmail.split("@")[0],
        phone: cleanPhone,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Đăng ký thất bại.");
    }

    const userData = {
      id: data.uid,
      uid: data.uid,
      name: cleanDisplayName || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      phone: this.normalizePhone(cleanPhone),
      authProvider: "email",
      joined: new Date().toLocaleDateString("vi-VN"),
      token: data.idToken,
    };

    localStorage.setItem("currentUser", JSON.stringify(userData));
    this.currentUser = userData;
    return userData;
  }

  async logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("redirectAfterLogin");
    localStorage.removeItem("ps_user");
    sessionStorage.removeItem("googleUserData");
    clearFirebaseAuthCache();
    if (window.firebaseAuth) {
      await window.firebaseAuth.signOut();
    }
    this.currentUser = null;
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
  }

  getCurrentUser() {
    return this.currentUser || JSON.parse(localStorage.getItem("currentUser"));
  }

  isLoggedIn() {
    return !!this.getCurrentUser();
  }
}

const googleAuth = new GoogleAuthManager();
window.googleAuth = googleAuth;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    googleAuth.initialize();
  });
} else {
  googleAuth.initialize();
}
