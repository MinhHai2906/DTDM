window.firebaseAuth = null;
window.firebaseDb = null;
window.googleProvider = null;

if (window.firebase) {
	const phoneStoreFirebaseConfig = {
		apiKey: "AIzaSyDk1XTVn68McS02jMIXnyQ3bqtpLF3L1XQ",
		authDomain: "web-dienthoai0-dtdm.firebaseapp.com",
		projectId: "web-dienthoai0-dtdm",
		storageBucket: "web-dienthoai0-dtdm.firebasestorage.app",
		messagingSenderId: "102142538462",
		appId: "1:102142538462:web:8c2c6c4637a54304ef484f",
	};

	if (!firebase.apps.length) {
		firebase.initializeApp(phoneStoreFirebaseConfig);
	}

	window.firebaseAuth = firebase.auth();
	window.firebaseDb = firebase.firestore();
	window.googleProvider = new firebase.auth.GoogleAuthProvider();
	window.googleProvider.setCustomParameters({ prompt: "select_account" });
}
