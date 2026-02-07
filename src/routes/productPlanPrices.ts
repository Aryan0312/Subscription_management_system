import express from "express";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { createProductPlanPrice } from "../controller/productPlanPrices/createProductPlan.js";
import { getAllProducts } from "../controller/products/getAllProducts.js";
import { getProductsByRecurringPlan } from "../controller/productPlanPrices/getAllProductsForPlan.js";

export const productPlanPricesRouter = express.Router();

productPlanPricesRouter.post(
  "/",
  allowedRole(["super_admin", "admin"]),
  createProductPlanPrice
);

productPlanPricesRouter.get(
  "/:id",
  allowedRole(["super_admin", "admin"]),
  getProductsByRecurringPlan
);

// productPlanPricesRouter.get(
//   "/:id",
//   allowedRole(["super_admin", "admin", "user"]),
//   getProductById
// );

// productPlanPricesRouter.put(
//   "/:product_id",
//   allowedRole(["super_admin", "admin"]),
//   updateProduct
// );
// productPlanPricesRouter.put(
//   "/:product_id/archive",
//   allowedRole(["super_admin", "admin"]),
//   archiveProduct
// );

export default productPlanPricesRouter;
