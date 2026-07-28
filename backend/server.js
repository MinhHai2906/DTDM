const express = require("express");
const cors = require("cors");
const { deleteUserCompletely } = require("./import-users");
const { admin, auth } = require("./firebase-admin");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

const ADMIN_ACCOUNTS = [
  { email: "admin@gmail.com", password: "123456", uid: "admin-gmail" },
  { email: "admin@mobistore.vn", password: "admin123", uid: "admin-mobistore" },
];

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function isKnownAdminCredential(email, password) {
  const normalizedEmail = normalizeEmail(email);
  return (
    ADMIN_ACCOUNTS.find(
      (account) =>
        account.email === normalizedEmail && account.password === password,
    ) || null
  );
}

async function upsertAdminAccount(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const adminAccount = isKnownAdminCredential(normalizedEmail, password);

  if (!adminAccount) {
    return {
      success: false,
      status: 401,
      error: "Sai tài khoản hoặc mật khẩu admin.",
    };
  }

  let existingUser = null;
  try {
    existingUser = await auth.getUserByEmail(normalizedEmail);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  if (existingUser) {
    try {
      await admin
        .firestore()
        .collection("users")
        .doc(existingUser.uid)
        .delete();
    } catch (firestoreError) {
      console.warn(
        "Could not delete existing admin Firestore record:",
        firestoreError.message,
      );
    }

    await auth.deleteUser(existingUser.uid);
  }

  const createdUser = await auth.createUser({
    uid: adminAccount.uid,
    email: normalizedEmail,
    password,
    emailVerified: true,
    displayName: "Admin",
  });

  await admin.firestore().collection("users").doc(createdUser.uid).set({
    uid: createdUser.uid,
    email: normalizedEmail,
    emailNormalized: normalizedEmail,
    displayName: "Admin",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { success: true, uid: createdUser.uid, email: normalizedEmail };
}

app.post("/api/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const adminAccount = isKnownAdminCredential(email, password);

    if (!adminAccount) {
      return res
        .status(401)
        .json({ error: "Sai tài khoản hoặc mật khẩu admin." });
    }

    const token = await auth.createCustomToken(adminAccount.uid, {
      admin: true,
      role: "admin",
      email: adminAccount.email,
    });

    return res.json({
      token,
      uid: adminAccount.uid,
      email: adminAccount.email,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Không thể đăng nhập admin." });
  }
});

app.post("/api/admin-bootstrap", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await upsertAdminAccount(email, password);

    if (!result.success) {
      return res
        .status(result.status || 500)
        .json({ error: result.error || "Không thể tạo lại admin." });
    }

    return res.json({
      message: "Admin account recreated successfully",
      uid: result.uid,
      email: result.email,
    });
  } catch (error) {
    console.error("Admin bootstrap error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Không thể tạo lại admin." });
  }
});

// API endpoint to delete user completely
app.delete("/api/users/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ error: "User UID is required" });
    }

    console.log(`API request to delete user: ${uid}`);

    const result = await deleteUserCompletely(uid);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("API endpoints:");
  console.log("   POST /api/admin-login - Admin login with custom token");
  console.log("   DELETE /api/users/:uid - Delete one user completely");
  console.log("   GET /api/health - Health check");
});
