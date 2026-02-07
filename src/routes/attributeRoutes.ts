import express from "express";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import {  getAllAttributesWithValues } from "../controller/attribute/getAllAttributeWithValues.js";
import {updateAttributeWithValues } from "../controller/attribute/updateAttributeWithValues.js";
import { createAttributeWithValues } from "../controller/attribute/createAtrribute.js";

export const attributeRouter = express.Router();

/**
 * Attributes CRUD
 * Only admin / super_admin allowed
 */

// 1️⃣ Create attribute
attributeRouter.post(
  "/",
  allowedRole(["super_admin", "admin"]),
  createAttributeWithValues
);

// 2️⃣ Get all attributes
attributeRouter.get(
  "/",
  allowedRole(["super_admin", "admin"]),
  getAllAttributesWithValues
);

// 3️⃣ Update attribute
attributeRouter.put(
  "/:id",
  allowedRole(["super_admin", "admin"]),
  updateAttributeWithValues
);


export default attributeRouter;
