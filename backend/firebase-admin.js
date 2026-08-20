const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountFile = require("fs").existsSync(
    require("path").join(__dirname, "serviceAccountKey.json"),
  )
    ? require("./serviceAccountKey.json")
    : null;

  const credential = serviceAccountJson
    ? admin.credential.cert(JSON.parse(serviceAccountJson))
    : serviceAccountFile
      ? admin.credential.cert(serviceAccountFile)
      : admin.credential.applicationDefault();

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.log("Firebase Admin: using FIREBASE_SERVICE_ACCOUNT_JSON.");
  } else if (serviceAccountFile) {
    console.log("Firebase Admin: using local serviceAccountKey.json.");
  } else {
    console.log("Firebase Admin: using Google Cloud Application Default Credentials.");
  }

  admin.initializeApp({
    credential,
    databaseURL:
      process.env.FIREBASE_DATABASE_URL ||
      "https://web-dienthoai0-dtdm-default-rtdb.firebaseio.com",
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
