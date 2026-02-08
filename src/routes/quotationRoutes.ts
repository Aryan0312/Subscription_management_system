import express from "express";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { createQuotation } from "../controller/quotation/createQuotation.js";
import { getAllQuotations } from "../controller/quotation/getAllQuotations.js";
import { getQuotationById } from "../controller/quotation/getQuotationById.js";
import { deleteQuotation } from "../controller/quotation/deleteQuotation.js";

export const quotationRouter = express.Router();

quotationRouter.post(
  "/",
  allowedRole(["admin", "super_admin"]),
  createQuotation
);

quotationRouter.get(
  "/",
  allowedRole(["admin", "super_admin"]),
  getAllQuotations
);

quotationRouter.get(
  "/:id",
  allowedRole(["admin", "super_admin"]),
  getQuotationById
);

quotationRouter.delete(
  "/:id",
  allowedRole(["admin", "super_admin"]),
  deleteQuotation
);

export default quotationRouter;
