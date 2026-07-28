const express = require("express");
const ProductService = require("../services/productService");

function createProductsRouter({ productService }) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const products = await productService.listProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const payload = req.body || {};
      if (!payload.name) {
        return res.status(400).json({ error: "name is required" });
      }
      const product = await productService.createProduct(payload);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body || {},
      );
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const result = await productService.deleteProduct(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createProductsRouter;
