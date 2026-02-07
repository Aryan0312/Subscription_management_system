import express from "express";

import { getTaxById } from "../controller/taxes/getTaxById.js";
import { updateTax } from "../controller/taxes/updateTax.js";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { getAllTaxes } from "../controller/taxes/getAllTaxes.js";
import { createTax } from "../controller/taxes/createTax.js";

export const taxRouter = express.Router();

taxRouter.post("/", allowedRole(["admin", "super_admin"]), createTax);
taxRouter.get("/", allowedRole(["admin", "super_admin"]), getAllTaxes);
taxRouter.get("/:tax_id", allowedRole(["admin", "super_admin"]), getTaxById);
taxRouter.put("/:tax_id", allowedRole(["admin", "super_admin"]), updateTax);

export default taxRouter;
