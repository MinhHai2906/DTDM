const express = require("express");
const cors = require("cors");
const { deleteUserCompletely } = require("./import-users");
const { admin, auth } = require("./firebase-admin");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const createProductsRouter = require("./routes/products");
const ProductService = require("./services/productService");

function getFirebaseWebApiKey() {
  return (
    process.env.FIREBASE_WEB_API_KEY ||
    "AIzaSyDk1XTVn68McS02jMIXnyQ3bqtpLF3L1XQ"
  );
}

async function firebaseAuthApi(path, payload) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${getFirebaseWebApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || "Firebase Auth request failed.";
    const error = new Error(message);
    error.code = data?.error?.status || "auth/failed";
    throw error;
  }

  return data;
}

function createApp(options = {}) {
  const app = express();
  const PORT = process.env.PORT || 3001;
  const productService = options.productService || new ProductService(admin);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  const ADMIN_ACCOUNTS = [
    { email: "admin@gmail.com", password: "123456", uid: "admin-gmail" },
    {
      email: "admin@mobistore.vn",
      password: "admin123",
      uid: "admin-mobistore",
    },
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

  app.use("/api/products", createProductsRouter({ productService }));

  app.get("/api/users", async (req, res) => {
    try {
      const snapshot = await admin.firestore().collection("users").get();
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json(users);
    } catch (error) {
      console.error("List users error:", error);
      res.status(500).json({ error: error.message || "Không thể tải danh sách người dùng." });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { displayName, email, password, role = "user" } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: "Email và password là bắt buộc." });
      }

      const normalizedEmail = normalizeEmail(email);
      const finalRole = role === "admin" ? "admin" : "user";

      try {
        const existing = await auth.getUserByEmail(normalizedEmail);
        if (existing) {
          return res.status(409).json({ error: `Email ${normalizedEmail} đã tồn tại.` });
        }
      } catch (error) {
        if (error.code !== "auth/user-not-found") {
          throw error;
        }
      }

      const createdUser = await auth.createUser({
        email: normalizedEmail,
        password,
        displayName: displayName || normalizedEmail.split("@")[0],
        emailVerified: true,
      });

      await admin.firestore().collection("users").doc(createdUser.uid).set({
        uid: createdUser.uid,
        displayName: displayName || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        role: finalRole,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json({
        id: createdUser.uid,
        uid: createdUser.uid,
        displayName: displayName || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: finalRole,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: error.message || "Không thể tạo người dùng." });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { displayName, email, role = "user" } = req.body || {};
      const ref = admin.firestore().collection("users").doc(id);
      const currentDoc = await ref.get();

      if (!currentDoc.exists) {
        return res.status(404).json({ error: "Người dùng không tồn tại." });
      }

      const currentData = currentDoc.data() || {};
      const normalizedEmail = email ? normalizeEmail(email) : currentData.email;
      const finalRole = role === "admin" ? "admin" : "user";

      const updatePayload = {
        displayName: displayName || currentData.displayName || "User",
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        role: finalRole,
        updatedAt: new Date(),
      };

      await auth.updateUser(id, {
        email: normalizedEmail,
        displayName: updatePayload.displayName,
      });

      await ref.update(updatePayload);
      res.json({ id, ...currentData, ...updatePayload });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: error.message || "Không thể cập nhật người dùng." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "Email và mật khẩu là bắt buộc." });
      }

      const authResult = await firebaseAuthApi("accounts:signInWithPassword", {
        email,
        password,
        returnSecureToken: true,
      });

      const userRecord = await auth.getUser(authResult.localId);
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userRecord.uid)
        .get();

      const userData = userDoc.exists ? userDoc.data() : {};
      return res.json({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userData.displayName || userRecord.email.split("@")[0],
        emailVerified: userRecord.emailVerified,
        idToken: authResult.idToken,
        refreshToken: authResult.refreshToken,
        expiresIn: authResult.expiresIn,
      });
    } catch (error) {
      console.error("User login error:", error);
      return res.status(401).json({ error: error.message || "Đăng nhập thất bại." });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, displayName, phone } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "Email và mật khẩu là bắt buộc." });
      }

      const authResult = await firebaseAuthApi("accounts:signUp", {
        email,
        password,
        returnSecureToken: true,
      });

      const normalizedName = (displayName || email.split("@")[0]).trim();
      const userRecord = await auth.getUser(authResult.localId);
      await auth.updateUser(userRecord.uid, {
        displayName: normalizedName,
        phoneNumber: phone || null,
      });

      await admin.firestore().collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        displayName: normalizedName,
        email: normalizeEmail(email),
        emailNormalized: normalizeEmail(email),
        phone: phone || "",
        phoneNormalized: (phone || "").replace(/[^\d]/g, ""),
        role: "user",
        authProvider: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      return res.status(201).json({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: normalizedName,
        idToken: authResult.idToken,
        refreshToken: authResult.refreshToken,
        expiresIn: authResult.expiresIn,
      });
    } catch (error) {
      console.error("User register error:", error);
      return res.status(400).json({ error: error.message || "Đăng ký thất bại." });
    }
  });

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

  function buildTimelineForStatus(status) {
    const stamp = new Date().toISOString();

    if (status === "Đã hủy") {
      return [
        { step: "Đặt hàng", done: true, current: false, time: stamp },
        { step: "Đã hủy", done: true, current: true, cancelled: true, time: stamp },
      ];
    }

    return [
      {
        step: "Đặt hàng",
        done: true,
        current: status === "Chờ xác nhận",
        time: stamp,
      },
      {
        step: "Đã xác nhận",
        done: ["Đã xác nhận", "Đang giao hàng", "Đã giao hàng thành công"].includes(status),
        current: status === "Đã xác nhận",
        time: status === "Đã xác nhận" ? stamp : "",
      },
      {
        step: "Đang giao hàng",
        done: ["Đang giao hàng", "Đã giao hàng thành công"].includes(status),
        current: status === "Đang giao hàng",
        time: status === "Đang giao hàng" ? stamp : "",
      },
      {
        step: "Đã giao hàng thành công",
        done: status === "Đã giao hàng thành công",
        current: status === "Đã giao hàng thành công",
        time: status === "Đã giao hàng thành công" ? stamp : "",
      },
    ];
  }

  app.get("/api/orders", async (req, res) => {
    try {
      const { userId } = req.query;
      const collectionRef = admin.firestore().collection("orders");

      // Avoid composite-index failure for where(userId) + orderBy(createdAt)
      // by sorting in memory when filtering by userId.
      const snapshot = userId
        ? await collectionRef.where("userId", "==", userId).get()
        : await collectionRef.orderBy("createdAt", "desc").get();

      const toMillis = (value) => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        if (typeof value?.toDate === "function") return value.toDate().getTime();
        const parsed = new Date(value).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      const rawOrders = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      const ordersByBusinessId = new Map();
      rawOrders.forEach((order) => {
        const businessId = order.orderCode || order.id;
        const existing = ordersByBusinessId.get(businessId);
        if (
          !existing ||
          order.status === "Đã hủy" ||
          toMillis(order.updatedAt) > toMillis(existing.updatedAt)
        ) {
          ordersByBusinessId.set(businessId, order);
        }
      });

      const orders = Array.from(ordersByBusinessId.values())
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      res.json(orders);
    } catch (error) {
      console.error("List orders error:", error);
      res.status(500).json({ error: error.message || "Không thể tải đơn hàng." });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const incoming = req.body || {};
      const userId = incoming.userId || incoming.uid || "guest";
      const order = {
        ...incoming,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: incoming.status || "Chờ xác nhận",
        timeline: incoming.timeline || [
          {
            step: "Đặt hàng",
            done: true,
            current: true,
            time: new Date().toISOString(),
          },
        ],
      };

      const docRef = await admin.firestore().collection("orders").add(order);
      res.status(201).json({ id: docRef.id, ...order });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: error.message || "Không thể tạo đơn hàng." });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await admin.firestore().collection("orders").doc(id).delete();
      res.json({ id, deleted: true });
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(500).json({ error: error.message || "Không thể xóa đơn hàng." });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body || {};
      const { id } = req.params;

      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }

      const ordersCollection = admin.firestore().collection("orders");
      const refs = new Map();
      const directRef = ordersCollection.doc(id);
      const directDoc = await directRef.get();
      if (directDoc.exists) refs.set(directDoc.id, directRef);

      const [idMatches, orderCodeMatches] = await Promise.all([
        ordersCollection.where("id", "==", id).get(),
        ordersCollection.where("orderCode", "==", id).get(),
      ]);
      [...idMatches.docs, ...orderCodeMatches.docs].forEach((doc) => {
        refs.set(doc.id, ordersCollection.doc(doc.id));
      });

      if (refs.size === 0) {
        return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
      }

      const updated = {
        status,
        timeline: buildTimelineForStatus(status),
        updatedAt: new Date(),
      };

      if (status === "Đã hủy" && req.body.cancellationReason) {
        updated.cancellationReason = req.body.cancellationReason;
      }

      await Promise.all(
        Array.from(refs.values()).map((ref) => ref.set(updated, { merge: true })),
      );
      res.json({ id, status, updatedAt: updated.updatedAt.toISOString() });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: error.message || "Không thể cập nhật trạng thái đơn hàng." });
    }
  });

  app.get("/api/reviews", async (req, res) => {
    try {
      const { product, status } = req.query;
      let query = admin.firestore().collection("reviews");

      if (product) {
        query = query.where("product", "==", product);
      }

      if (status) {
        query = query.where("status", "==", status);
      }

      const snapshot = await query.get();
      const reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json(reviews);
    } catch (error) {
      console.error("List reviews error:", error);
      res.status(500).json({ error: error.message || "Không thể tải bình luận." });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const { userId, customer, product, content, star, status = "approved", verified = false } = req.body || {};

      if (!userId || !product || !content) {
        return res.status(400).json({ error: "Thiếu thông tin đánh giá." });
      }

      const review = {
        userId,
        customer: customer || "Khách hàng",
        product,
        content,
        star: Number(star) || 5,
        status,
        verified: !!verified,
        reply: "",
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await admin.firestore().collection("reviews").add(review);
      res.status(201).json({ id: docRef.id, ...review });
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ error: error.message || "Không thể gửi đánh giá." });
    }
  });

  app.delete("/api/reviews/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await admin.firestore().collection("reviews").doc(id).delete();
      res.json({ id, deleted: true });
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({ error: error.message || "Không thể xóa bình luận." });
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

  app.use(errorHandler);

  return { app, PORT };
}

if (require.main === module) {
  const { app, PORT } = createApp();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("API endpoints:");
    console.log("   POST /api/admin-login - Admin login with custom token");
    console.log("   DELETE /api/users/:uid - Delete one user completely");
    console.log("   GET /api/health - Health check");
    console.log("   CRUD /api/products - Product service layer");
  });
}

module.exports = { createApp };
