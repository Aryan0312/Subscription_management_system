import express from "express";

import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { createContact } from "../controller/contact/createContact.js";
import { getAllContacts } from "../controller/contact/getAllContacts.js";
import { getContactById } from "../controller/contact/getContactById.js";

export const contactRouter = express.Router();

contactRouter.post(
  "/",
  allowedRole(["admin", "super_admin"]),
  createContact
);

contactRouter.get(
  "/",
  allowedRole(["admin", "super_admin"]),
  getAllContacts

);

contactRouter.get(
  "/:id",
  allowedRole(["admin", "super_admin"]),
  getContactById    
);

export default contactRouter;
