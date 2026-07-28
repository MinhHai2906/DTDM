class ProductService {
  constructor(firebaseAdmin) {
    this.firebaseAdmin = firebaseAdmin;
  }

  async listProducts() {
    const snapshot = await this.firebaseAdmin
      .firestore()
      .collection("products")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
