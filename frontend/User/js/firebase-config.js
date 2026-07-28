// Firebase Configuration
// Lấy từ Firebase Console - https://console.firebase.google.com

if (window.location.hostname === "127.0.0.1") {
  const targetUrl = new URL(window.location.href);
  targetUrl.hostname = "localhost";
  window.location.replace(targetUrl.toString());
}

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDk1XTVn68McS02jMIXnyQ3bqtpLF3L1XQ",
  authDomain: "web-dienthoai0-dtdm.firebaseapp.com",
  projectId: "web-dienthoai0-dtdm",
  storageBucket: "web-dienthoai0-dtdm.firebasestorage.app",
  messagingSenderId: "102142538462",
  appId: "1:102142538462:web:8c2c6c4637a54304ef484f",
  measurementId: "G-K9GZNWPW73",
};

// Khởi tạo Firebase App (nếu chưa có)
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

// Đợi Firebase SDK load và khởi tạo global objects
let initAttempts = 0;
const initFirebaseGlobals = () => {
  try {
    // Export Firebase Auth để sử dụng ở nơi khác (global)
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
    window.googleProvider = new firebase.auth.GoogleAuthProvider();

    // Cấu hình Google Provider (tùy chọn: thêm scope nếu cần)
    window.googleProvider.setCustomParameters({
      prompt: "select_account",
    });

    console.log("Firebase globals initialized successfully");
  } catch (error) {
    initAttempts++;
    if (initAttempts < 10) {
      console.log(`Firebase init attempt ${initAttempts} failed, retrying...`);
      setTimeout(initFirebaseGlobals, 100);
    } else {
      console.error(
        "Failed to initialize Firebase globals after 10 attempts:",
        error,
      );
    }
  }
};

// Chạy init sau một chút delay để đảm bảo Firebase SDK đã load
setTimeout(initFirebaseGlobals, 100);
