const admin = require("firebase-admin");

if (!admin.apps.length) {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    serviceAccount = require("./serviceAccountKey.json");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      process.env.FIREBASE_DATABASE_URL ||
      "https://web-dienthoai0-dtdm-default-rtdb.firebaseio.com",
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
