import express from "express";
import {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  updateDiscountStatus,
  validateDiscount
} from "../controller/discounts/discounts.js";
import { allowedRole } from "../middleware/auth/authMiddleware.js";

export const discountRouter = express.Router();

discountRouter.post("/", allowedRole(["admin", "super_admin"]), createDiscount);
discountRouter.get("/", allowedRole(["admin", "super_admin"]), getAllDiscounts);
discountRouter.get("/:discount_id", allowedRole(["admin", "super_admin"]), getDiscountById);
discountRouter.put("/:discount_id", allowedRole(["admin", "super_admin"]), updateDiscount);
discountRouter.put("/:discount_id/status", allowedRole(["admin", "super_admin"]), updateDiscountStatus);

// Internal
discountRouter.post("/validate", validateDiscount);

export default discountRouter;
