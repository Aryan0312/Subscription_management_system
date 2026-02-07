import express from "express";
import { createProduct } from "../controller/products/createProduct.js";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { getAllProducts } from "../controller/products/getAllProducts.js";
import { getProductById } from "../controller/products/getProductById.js";

export const productRouter = express.Router();

productRouter.post(
  "/",
  allowedRole(["super_admin", "admin"]),
  createProduct
);

productRouter.get(
  "/",
  allowedRole(["super_admin", "admin", "user"]),
  getAllProducts
);

productRouter.get(
  "/:id",
  allowedRole(["super_admin", "admin", "user"]),
  getProductById
);

export default productRouter;
