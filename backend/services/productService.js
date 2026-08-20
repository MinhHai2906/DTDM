class ProductService {
  constructor(firebaseAdmin) {
    this.firebaseAdmin = firebaseAdmin;
  }

  getDemoProducts() {
    return [
      {
        id: "demo-iphone-15",
        name: "iPhone 15",
        price: 24990000,
        brand: "Apple",
        category: "phone",
        image: "assets/images/iphone15.png",
        isNew: true,
        isSale: true,
        discount: 8,
      },
      {
        id: "demo-samsung-s24",
        name: "Samsung Galaxy S24",
        price: 21990000,
        brand: "Samsung",
        category: "phone",
        image: "assets/images/samsung-s24.png",
        isNew: true,
        isSale: true,
        discount: 10,
      },
      {
        id: "demo-xiaomi-14",
        name: "Xiaomi 14",
        price: 16990000,
        brand: "Xiaomi",
        category: "phone",
        image: "assets/images/xiaomi14.png",
        isNew: false,
        isSale: true,
        discount: 12,
      },
      {
        id: "demo-airpods",
        name: "AirPods Pro",
        price: 4990000,
        brand: "Apple",
        category: "headphone",
        image: "assets/images/airpods.png",
        isNew: false,
        isSale: false,
        discount: 0,
      },
    ];
  }

  async ensureSeedProducts() {
    const firestore = this.firebaseAdmin.firestore();
    const snapshot = await firestore.collection("products").limit(1).get();

    if (!snapshot.empty) {
      return false;
    }

    const seedProducts = [
      {
        id: "seed-iphone-15",
        name: "iPhone 15",
        price: 24990000,
        brand: "Apple",
        category: "phone",
        image: "assets/images/IP15.jpg",
        isNew: true,
        isSale: true,
        discount: 8,
        rating: 4.8,
      },
      {
        id: "seed-samsung-s24",
        name: "Samsung Galaxy S24",
        price: 21990000,
        brand: "Samsung",
        category: "phone",
        image: "assets/images/SSS24P.jpg",
        isNew: true,
        isSale: true,
        discount: 10,
        rating: 4.8,
      },
      {
        id: "seed-xiaomi-14",
        name: "Xiaomi 14",
        price: 16990000,
        brand: "Xiaomi",
        category: "phone",
        image: "assets/images/X14U.jpg",
        isNew: false,
        isSale: true,
        discount: 12,
        rating: 4.7,
      },
      {
        id: "seed-airpods-pro",
        name: "AirPods Pro",
        price: 4990000,
        brand: "Apple",
        category: "headphone",
        image: "assets/images/airpods.png",
        isNew: false,
        isSale: false,
        discount: 0,
        rating: 4.7,
      },
    ];

    const batch = firestore.batch();
    seedProducts.forEach((product) => {
      const docRef = firestore.collection("products").doc(product.id);
      batch.set(docRef, {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    await batch.commit();
    return true;
  }

  async listProducts() {
    try {
      const firestore = this.firebaseAdmin.firestore();
      const snapshot = await firestore.collection("products").get();

      if (snapshot.empty) {
        await this.ensureSeedProducts();
        const seeded = await firestore.collection("products").get();
        const products = seeded.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (products.length > 0) return products;
      }

      const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (products.length > 0) return products;
      return this.getDemoProducts();
    } catch (error) {
      console.warn("Firestore unavailable, using demo products:", error.message);
      return this.getDemoProducts();
    }
  }

  async createProduct(payload) {
    const ref = await this.firebaseAdmin
      .firestore()
      .collection("products")
      .add({
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  }

  async updateProduct(id, payload) {
    const ref = this.firebaseAdmin.firestore().collection("products").doc(id);
    await ref.update({ ...payload, updatedAt: new Date() });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  }

  async deleteProduct(id) {
    await this.firebaseAdmin
      .firestore()
      .collection("products")
      .doc(id)
      .delete();
    return { id };
  }
}

module.exports = ProductService;
