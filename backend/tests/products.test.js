const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../server");

function buildFakeProductService() {
  const products = [
    {
      id: "p1",
      name: "iPhone 15",
      price: 25000000,
      brand: "Apple",
      category: "smartphone",
    },
  ];

  return {
    listProducts: async () => products,
    createProduct: async (payload) => {
      const created = { id: "p2", ...payload };
      products.push(created);
      return created;
    },
    updateProduct: async (id, payload) => {
      const index = products.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error("Product not found");
      }
      products[index] = { ...products[index], ...payload };
      return products[index];
    },
    deleteProduct: async (id) => {
      const index = products.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error("Product not found");
      }
      products.splice(index, 1);
      return { id };
    },
  };
}

test("GET /api/products returns product list", async () => {
  const app = createApp({ productService: buildFakeProductService() });

  const response = await request(app).get("/api/products").expect(200);

  assert.ok(Array.isArray(response.body));
  assert.equal(response.body[0].name, "iPhone 15");
});

test("POST /api/products creates a new product", async () => {
  const app = createApp({ productService: buildFakeProductService() });

  const response = await request(app)
    .post("/api/products")
    .send({
      name: "Galaxy S24",
      price: 20000000,
      brand: "Samsung",
      category: "smartphone",
    })
    .expect(201);

  assert.equal(response.body.name, "Galaxy S24");
  assert.equal(response.body.brand, "Samsung");
});
