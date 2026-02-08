import express from "express";
import { createBulkProductVariants } from "../controller/attribute/createBulkProductVariants.js";
import { allowedRole } from "../middleware/auth/authMiddleware.js";

export const productVariantRouter = express.Router();

productVariantRouter.post(
  "/bulk",
  allowedRole(["admin", "super_admin"]),
  createBulkProductVariants
);

export default productVariantRouter;
