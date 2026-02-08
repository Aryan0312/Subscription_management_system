import express from "express";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { generateInvoiceFromSubscription } from "../controller/invoice/generateInvoice.js";
import { getInvoiceById } from "../controller/invoice/getInvoiceById.js";
import { downloadInvoicePDF } from "../controller/invoice/downloadInvoicePDF.js";

export const invoiceRouter = express.Router();

invoiceRouter.post(
  "/generate/:id",
  allowedRole(["admin", "super_admin"]),
  generateInvoiceFromSubscription
);

invoiceRouter.get(
  "/:id",
  allowedRole(["admin", "super_admin", "user"]),
  getInvoiceById
);

invoiceRouter.get(
  "/:id/download",
  allowedRole(["admin", "super_admin", "user"]),
  downloadInvoicePDF
);

export default invoiceRouter;
