/**
 * Google Authentication Module với Firebase Auth
 * Xử lý đăng nhập và đăng ký sử dụng Google Gmail qua Firebase
 *
 * Dependencies:
 * - firebase-config.js (phải tải trước)
 * - Firebase SDK (từ CDN hoặc npm)
 */

// Import Firestore
// Sử dụng compat mode
// const db = firebase.firestore();

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

function isForceLogoutMarked() {
  return localStorage.getItem(FORCE_LOGOUT_KEY) === "1";
}

class GoogleAuthManager {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.db = null;
  }

  normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  normalizePhone(phone) {
    return (phone || "").replace(/[^\d]/g, "");
  }

  async checkDuplicateAccount(email, phone = "") {
    if (!this.db) return null;

    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPhone = this.normalizePhone(phone);
    const usersRef = this.db.collection("users");

    if (normalizedEmail) {
      const emailNormalizedSnapshot = await usersRef
        .where("emailNormalized", "==", normalizedEmail)
        .limit(1)
        .get();
      if (!emailNormalizedSnapshot.empty) return "email";

      const emailSnapshot = await usersRef
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();
      if (!emailSnapshot.empty) return "email";
    }

    if (normalizedPhone) {
      const phoneNormalizedSnapshot = await usersRef
        .where("phoneNormalized", "==", normalizedPhone)
        .limit(1)
        .get();
      if (!phoneNormalizedSnapshot.empty) return "phone";

      const phoneSnapshot = await usersRef
        .where("phone", "==", phone)
        .limit(1)
        .get();
      if (!phoneSnapshot.empty) return "phone";
    }

    return null;
  }

  /**
   * Show error message
   * @param {string} message
   */
  showError(message) {
    console.error("Auth Error:", message);
    // Try to show in UI if available
    if (typeof window.showError === "function") {
      window.showError(message);
    }
  }

  /**
   * Show success message
   * @param {string} message
   */
  showSuccess(message) {
    console.log("Auth Success:", message);
    // Try to show in UI if available
    if (typeof window.showSuccess === "function") {
      window.showSuccess(message);
    }
  }

  /**
   * Khởi tạo Firebase Auth
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Đợi Firebase config load hoàn toàn
      let attempts = 0;
      while (
        (!window.firebaseAuth || !window.googleProvider) &&
        attempts < 100
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        attempts++;
      }

      if (!window.firebaseAuth) {
        throw new Error("Firebase Auth not available after waiting");
      }
      if (!window.googleProvider) {
        throw new Error("Google Provider not available after waiting");
      }

      // Firebase đã được khởi tạo trong firebase-config.js
      this.db = window.firebaseDb;
      this.isInitialized = true;
      console.log(" Firebase Auth khởi tạo thành công");

      // Lắng nghe trạng thái auth thay đổi
      window.firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          if (isForceLogoutMarked()) {
            window.firebaseAuth
              .signOut()
              .catch((error) => {
                console.warn("Force signOut failed:", error);
              })
              .finally(() => {
                this.currentUser = null;
                localStorage.removeItem("currentUser");
                sessionStorage.removeItem("googleUserData");
                clearFirebaseAuthCache();
              });
            return;
          }
          this.handleAuthStateChanged(user);
        } else {
          this.currentUser = null;
        }
      });

      return true;
    } catch (error) {
      console.error(" Lỗi khởi tạo Firebase Auth:", error);
      return false;
    }
  }

  /**
   * Render Google Sign-In Button (sử dụng Firebase Auth)
   * @param {string} elementId - ID của element chứa nút
   * @param {string} mode - 'signin' hoặc 'signup' (chỉ để hiển thị, Firebase xử lý chung)
   * @returns {void}
   */
  renderSignInButton(elementId, mode = "signin") {
    console.log(" Đang kết nối Google Sign-In handler cho element:", elementId);
    if (!this.isInitialized) {
      console.warn(" Firebase Auth chưa được khởi tạo");
      return;
    }

    const button = document.getElementById("googleSignInBtn");
    if (!button) {
      console.error(" Nút Google Sign-In với id googleSignInBtn không tồn tại");
      return;
    }

    button.addEventListener("click", () => this.signInWithGoogle());
    console.log(" Google Sign-In button đã liên kết sự kiện click");
  }

  /**
   * Đăng nhập bằng Google qua Firebase
   */
  async signInWithGoogle() {
    try {
      clearForceLogout();
      const result = await window.firebaseAuth.signInWithPopup(
        window.googleProvider,
      );
      const user = result.user;

      if (!user) {
        throw new Error("No user data received from Google sign-in");
      }

      console.log(" Đăng nhập Google thành công:", user);

      // Xử lý user data (lưu vào localStorage và Firebase nếu cần)
      await this.handleSignIn(user);
    } catch (error) {
      console.error(" Lỗi đăng nhập Google:", error);
      let errorMessage = "Đăng nhập Google thất bại. Vui lòng thử lại!";

      // Xử lý các lỗi Google Auth
      switch (error.code) {
        case "auth/popup-closed-by-user":
          errorMessage = "Bạn đã đóng cửa sổ đăng nhập! Vui lòng thử lại.";
          break;
        case "auth/popup-blocked":
          errorMessage =
            "Trình duyệt chặn popup! Vui lòng cho phép popup và thử lại.";
          break;
        case "auth/cancelled-popup-request":
          errorMessage = "Đã hủy yêu cầu đăng nhập!";
          break;
        case "auth/account-exists-with-different-credential":
          errorMessage =
            "Email đã được đăng ký bằng phương thức khác! Vui lòng đăng nhập bằng email/mật khẩu.";
          break;
        default:
          if (error.message) {
            const vietnameseMessage = this.translateFirebaseMessage(
              error.message,
            );
            errorMessage =
              vietnameseMessage ||
              "Đăng nhập Google thất bại! Vui lòng thử lại.";
          }
          break;
      }

      this.showError(errorMessage);
    }
  }

  /**
   * Xử lý đăng nhập thành công
   * @param {Object} user - User từ Firebase Auth
   */
  async handleSignIn(user) {
    try {
      // Xác định provider
      let authProvider = "email"; // default
      if (user.providerData && user.providerData.length > 0) {
        authProvider =
          user.providerData[0].providerId === "google.com" ? "google" : "email";
      }

      let joinedDateStr = "";
      if (user && user.metadata && user.metadata.creationTime) {
        const date = new Date(user.metadata.creationTime);
        joinedDateStr = date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else {
        joinedDateStr = new Date().toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      // Lưu user vào localStorage
      clearForceLogout();
      const userData = {
        id: user.uid,
        name: user.displayName || user.email.split("@")[0], // fallback for email users
        email: this.normalizeEmail(user.email),
        phone: user.phoneNumber || "",
        avatar: user.photoURL || "",
        authProvider: authProvider,
        joined: joinedDateStr,
      };

      localStorage.setItem("currentUser", JSON.stringify(userData));
      this.currentUser = userData;
      window.dispatchEvent(
        new CustomEvent("userLoggedIn", { detail: userData }),
      );

      // Kiểm tra và lưu vào Firestore nếu chưa có (chỉ nếu db available)
      if (this.db) {
        try {
          const userDocRef = this.db.collection("users").doc(user.uid);
          const userDoc = await userDocRef.get();
          if (!userDoc.exists) {
            await userDocRef.set({
              uid: user.uid,
              displayName: user.displayName || user.email.split("@")[0],
              email: this.normalizeEmail(user.email),
              emailNormalized: this.normalizeEmail(user.email),
              phone: user.phoneNumber || "",
              phoneNormalized: this.normalizePhone(user.phoneNumber || ""),
              role: "user",
              authProvider: authProvider,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } catch (dbError) {
          console.warn("Could not save to Firestore:", dbError.message);
        }
      }

      this.showSuccess("Đăng nhập thành công! Đang chuyển hướng...");

      setTimeout(() => {
        const redirect =
          localStorage.getItem("redirectAfterLogin") || "index.html";
        localStorage.removeItem("redirectAfterLogin");
        window.location.href = redirect;
      }, 1500);
    } catch (error) {
      console.error("❌ Lỗi xử lý user:", error);
      this.showError("Lỗi lưu dữ liệu. Vui lòng thử lại.");
    }
  }

  /**
   * Xử lý thay đổi trạng thái auth (từ Firebase)
   * @param {Object} user - User từ Firebase
   */
  handleAuthStateChanged(user) {
    if (user) {
      // Xác định provider
      let authProvider = "email"; // default
      if (user.providerData && user.providerData.length > 0) {
        authProvider =
          user.providerData[0].providerId === "google.com" ? "google" : "email";
      }

      let joinedDateStr = "";
      if (user && user.metadata && user.metadata.creationTime) {
        const date = new Date(user.metadata.creationTime);
        joinedDateStr = date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else {
        joinedDateStr = new Date().toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      this.currentUser = {
        id: user.uid,
        name: user.displayName || user.email.split("@")[0], // fallback for email users
        email: this.normalizeEmail(user.email),
        phone: user.phoneNumber || "",
        avatar: user.photoURL || "",
        authProvider: authProvider,
        joined: joinedDateStr,
      };
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
      window.dispatchEvent(
        new CustomEvent("userLoggedIn", { detail: this.currentUser }),
      );
    } else {
      this.currentUser = null;
      localStorage.removeItem("currentUser");
    }
  }

  /**
   * Đăng nhập bằng Email/Password qua Firebase
   * @param {string} email
   * @param {string} password
   */
  async signInWithEmailPassword(email, password) {
    try {
      clearForceLogout();
      const normalizedEmail = this.normalizeEmail(email);
      const userCredential =
        await window.firebaseAuth.signInWithEmailAndPassword(
          normalizedEmail,
          password,
        );
      const user = userCredential.user;

      // Xử lý user data
      await this.handleSignIn(user);

      return user;
    } catch (error) {
      console.error("❌ Lỗi đăng nhập:", error);

      // Xử lý các lỗi Firebase Auth
      let errorMessage = "Đăng nhập thất bại. Vui lòng thử lại!";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Không tìm thấy tài khoản với email này!";
          break;
        case "auth/wrong-password":
          errorMessage = "Mật khẩu không đúng! Vui lòng kiểm tra lại.";
          break;
        case "auth/invalid-email":
          errorMessage = "Địa chỉ email không hợp lệ!";
          break;
        case "auth/user-disabled":
          errorMessage = "Tài khoản đã bị khóa! Vui lòng liên hệ hỗ trợ.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Quá nhiều lần thử đăng nhập! Vui lòng thử lại sau.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Lỗi kết nối mạng! Vui lòng kiểm tra internet.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Thông tin đăng nhập không hợp lệ!";
          break;
        case "auth/account-exists-with-different-credential":
          errorMessage = "Tài khoản đã tồn tại với phương thức đăng nhập khác!";
          break;
        default:
          if (error.message) {
            // Dịch các thông báo Firebase phổ biến sang tiếng Việt
            const vietnameseMessage = this.translateFirebaseMessage(
              error.message,
            );
            errorMessage =
              vietnameseMessage || "Đăng nhập thất bại. Vui lòng thử lại!";
          }
          break;
      }

      this.showError(errorMessage);
      throw error;
    }
  }

  /**
   * Đăng ký bằng Email/Password qua Firebase
   * @param {string} email
   * @param {string} password
   * @param {string} displayName
   * @param {string} phone
   */
  async registerWithEmailPassword(email, password, displayName, phone) {
    try {
      clearForceLogout();
      const normalizedEmail = this.normalizeEmail(email);
      const normalizedPhone = this.normalizePhone(phone);
      const cleanDisplayName = (displayName || "").trim();
      const cleanPhone = (phone || "").trim();

      if (this.db) {
        try {
          const duplicateField = await this.checkDuplicateAccount(
            normalizedEmail,
            cleanPhone,
          );
          if (duplicateField) {
            const duplicateError = new Error(
              "Tài khoản đã có, vui lòng nhập tài khoản khác.",
            );
            duplicateError.code = "auth/account-already-exists";
            duplicateError.accountField = duplicateField;
            throw duplicateError;
          }
        } catch (duplicateCheckError) {
          if (duplicateCheckError.code === "auth/account-already-exists") {
            throw duplicateCheckError;
          }
          console.warn(
            "Could not verify duplicate account in Firestore:",
            duplicateCheckError.message,
          );
        }
      }

      // Tạo user với Firebase Auth
      const userCredential =
        await window.firebaseAuth.createUserWithEmailAndPassword(
          normalizedEmail,
          password,
        );
      const user = userCredential.user;

      // Cập nhật profile với display name
      await user.updateProfile({
        displayName: cleanDisplayName,
      });

      let joinedDateStr = "";
      if (user && user.metadata && user.metadata.creationTime) {
        const date = new Date(user.metadata.creationTime);
        joinedDateStr = date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else {
        joinedDateStr = new Date().toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      // Lưu thông tin bổ sung (phone) vào localStorage hoặc Firestore nếu cần
      const userData = {
        id: user.uid,
        name: cleanDisplayName,
        email: normalizedEmail,
        phone: cleanPhone,
        authProvider: "email",
        joined: joinedDateStr,
      };

      localStorage.setItem("currentUser", JSON.stringify(userData));
      this.currentUser = userData;

      // Lưu vào Firestore (chỉ nếu db available)
      if (this.db) {
        try {
          await this.db.collection("users").doc(user.uid).set({
            uid: user.uid,
            displayName: cleanDisplayName,
            email: normalizedEmail,
            emailNormalized: normalizedEmail,
            phone: cleanPhone,
            phoneNormalized: normalizedPhone,
            role: "user",
            authProvider: "email",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (dbError) {
          console.warn("Could not save to Firestore:", dbError.message);
        }
      }

      this.showSuccess("Đăng ký thành công! Đang chuyển hướng...");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);

      return user;
    } catch (error) {
      console.error("❌ Lỗi đăng ký:", error);
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);

      // Nếu Firebase Auth chưa khởi tạo, trả báo lỗi trực tiếp
      if (!this.isInitialized) {
        const status =
          "Firebase chưa sẵn sàng. Vui lòng thử lại sau khi load xong.";
        this.showError(status);
        throw error;
      }

      // Xử lý các lỗi Firebase Auth
      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại!";

      // Kiểm tra error code trước
      switch (error.code) {
        case "auth/account-already-exists":
        case "auth/email-already-in-use":
        case "auth/email-already-exists":
          errorMessage = "Tài khoản đã có, vui lòng nhập tài khoản khác.";
          break;
        case "auth/invalid-email":
          errorMessage =
            "Địa chỉ email không hợp lệ! Vui lòng kiểm tra lại định dạng email.";
          break;
        case "auth/weak-password":
          errorMessage =
            "Mật khẩu quá yếu! Vui lòng chọn mật khẩu có ít nhất 6 ký tự.";
          break;
        case "auth/operation-not-allowed":
          errorMessage =
            "Tính năng đăng ký chưa được bật. Vui lòng liên hệ quản trị viên!";
          break;
        case "auth/network-request-failed":
          errorMessage =
            "Lỗi kết nối mạng! Vui lòng kiểm tra internet và thử lại.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Quá nhiều yêu cầu! Vui lòng chờ một lúc rồi thử lại.";
          break;
        case "auth/invalid-password":
          errorMessage = "Mật khẩu không hợp lệ!";
          break;
        case "auth/requires-recent-login":
          errorMessage = "Vui lòng đăng nhập lại để thực hiện thao tác này!";
          break;
        default:
          // Luôn thử dịch message ngay cả khi có error code
          if (error.message) {
            const vietnameseMessage = this.translateFirebaseMessage(
              error.message,
            );
            if (
              vietnameseMessage &&
              vietnameseMessage !==
                error.message.replace("Firebase: ", "").split(" (")[0]
            ) {
              errorMessage = vietnameseMessage;
            } else {
              // Nếu không dịch được, tạo thông báo thân thiện
              errorMessage =
                "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại hoặc liên hệ hỗ trợ.";
            }
          }
          break;
      }

      this.showError(errorMessage);
      throw error;
    }
  }

  /**
   * Đăng xuất
   */
  async logout() {
    try {
      markForceLogout();
      await window.firebaseAuth.signOut();
      localStorage.removeItem("currentUser");
      localStorage.removeItem("redirectAfterLogin");
      localStorage.removeItem("ps_user");
      sessionStorage.removeItem("googleUserData");
      clearFirebaseAuthCache();
      this.currentUser = null;
      window.dispatchEvent(new CustomEvent("userLoggedOut"));
      console.log("✅ Đã đăng xuất");
    } catch (error) {
      console.error("❌ Lỗi đăng xuất:", error);
      throw error;
    }
  }

  /**
   * Lấy user hiện tại
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser || JSON.parse(localStorage.getItem("currentUser"));
  }

  /**
   * Kiểm tra đã đăng nhập
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!window.firebaseAuth.currentUser || !!this.getCurrentUser();
  }

  /**
   * Hiển thị lỗi
   * @param {string} message
   */
  showError(message) {
    const errorElement = document.getElementById("errorMessage");
    if (errorElement) {
      errorElement.innerHTML =
        "❌ " +
        message +
        '<button class="message-close" onclick="this.parentElement.style.display=\'none\'" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: none; border: none; font-size: 18px; cursor: pointer; color: inherit; opacity: 0.7;">×</button>';
      errorElement.style.display = "block";
      const successElement = document.getElementById("successMessage");
      if (successElement) successElement.style.display = "none";

      // Tự động cuộn lên chỗ thông báo lỗi
      setTimeout(() => {
        errorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } else {
      alert(message);
    }
  }

  /**
   * Hiển thị thành công
   * @param {string} message
   */
  showSuccess(message) {
    const successElement = document.getElementById("successMessage");
    if (successElement) {
      successElement.innerHTML =
        "✅ " +
        message +
        '<button class="message-close" onclick="this.parentElement.style.display=\'none\'" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: none; border: none; font-size: 18px; cursor: pointer; color: inherit; opacity: 0.7;">×</button>';
      successElement.style.display = "block";
      const errorElement = document.getElementById("errorMessage");
      if (errorElement) errorElement.style.display = "none";

      // Tự động cuộn lên chỗ thông báo thành công
      setTimeout(() => {
        successElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } else {
      alert(message);
    }
  }

  /**
   * Dịch thông báo Firebase sang tiếng Việt
   * @param {string} message - Thông báo gốc từ Firebase
   * @returns {string} - Thông báo đã dịch
   */
  translateFirebaseMessage(message) {
    if (!message) return null;

    // Loại bỏ prefix "Firebase: " và phần trong ngoặc đơn
    const cleanMessage = message
      .replace("Firebase: ", "")
      .split(" (")[0]
      .trim();

    // Từ điển dịch các thông báo phổ biến (sắp xếp theo độ ưu tiên)
    const translations = {
      // Email đã tồn tại - ưu tiên cao nhất
      "The email address is already in use by another account":
        "Email này đã được đăng ký rồi! Vui lòng sử dụng email khác hoặc đăng nhập nếu đã có tài khoản.",
      "The email address is already in use":
        "Email này đã được sử dụng! Vui lòng chọn email khác.",
      "Email already exists": "Email đã tồn tại trong hệ thống.",

      // Mật khẩu
      "Password should be at least 6 characters":
        "Mật khẩu phải có ít nhất 6 ký tự.",
      "The password must be 6 characters long or more":
        "Mật khẩu phải có ít nhất 6 ký tự.",
      "Password should be at least 6 characters long":
        "Mật khẩu phải có ít nhất 6 ký tự.",
      "The password is invalid": "Mật khẩu không hợp lệ.",
      "The password is invalid or the user does not have a password":
        "Mật khẩu không hợp lệ hoặc tài khoản chưa có mật khẩu.",

      // Email
      "The email address is badly formatted":
        "Địa chỉ email không đúng định dạng.",
      "The email address is not valid": "Địa chỉ email không hợp lệ.",
      "Invalid email address": "Địa chỉ email không hợp lệ.",

      // Tài khoản
      "There is no user record corresponding to this identifier":
        "Không tìm thấy tài khoản với thông tin này.",
      "The user account has been disabled by an administrator":
        "Tài khoản đã bị vô hiệu hóa bởi quản trị viên.",
      "User account is disabled": "Tài khoản đã bị khóa.",

      // Bảo mật
      "Too many unsuccessful login attempts":
        "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.",
      "Access to this account has been temporarily disabled due to many failed login attempts":
        "Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập thất bại.",
      "Too many requests":
        "Quá nhiều yêu cầu. Vui lòng chờ một lúc rồi thử lại.",

      // Mạng
      "A network error has occurred":
        "Đã xảy ra lỗi mạng. Vui lòng kiểm tra kết nối internet.",
      "Network request failed":
        "Yêu cầu mạng thất bại. Vui lòng kiểm tra kết nối internet.",
      "Network error": "Lỗi kết nối mạng.",

      // Quyền
      "This operation is not allowed": "Thao tác này không được phép.",
      "Operation not allowed": "Thao tác không được phép.",
      "Requires recent login": "Yêu cầu đăng nhập lại để tiếp tục.",

      // Popup
      "Popup was closed by the user before completing the sign in":
        "Cửa sổ đăng nhập đã bị đóng trước khi hoàn thành.",
      "The popup has been blocked by the browser":
        "Cửa sổ popup bị chặn bởi trình duyệt.",
      "Sign in with popup is not supported on this platform":
        "Đăng nhập bằng popup không được hỗ trợ trên nền tảng này.",

      // Thông tin đăng nhập
      "Invalid login credentials": "Thông tin đăng nhập không hợp lệ.",
      "Login credentials are invalid": "Thông tin đăng nhập không hợp lệ.",
      "The user's credential is no longer valid":
        "Thông tin đăng nhập không còn hợp lệ.",
      "Invalid credentials": "Thông tin đăng nhập không hợp lệ.",
    };

    // Tìm bản dịch chính xác nhất (độ dài chuỗi dài hơn = ưu tiên cao hơn)
    let bestMatch = null;
    let bestMatchLength = 0;

    for (const [english, vietnamese] of Object.entries(translations)) {
      if (cleanMessage.toLowerCase().includes(english.toLowerCase())) {
        if (english.length > bestMatchLength) {
          bestMatch = vietnamese;
          bestMatchLength = english.length;
        }
      }
    }

    // Nếu tìm thấy bản dịch, trả về
    if (bestMatch) {
      return bestMatch;
    }

    // Nếu không tìm thấy bản dịch, trả về thông báo gốc đã làm sạch
    console.warn("Không tìm thấy bản dịch cho:", cleanMessage);
    return cleanMessage;
  }
}

// Tạo instance toàn cục
const googleAuth = new GoogleAuthManager();
window.googleAuth = googleAuth;

// Khởi tạo khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", async () => {
  await googleAuth.initialize();
});
