import express from "express";

import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { createSubscriptionLine } from "../controller/subscriptionLines/createSubscriptionLines.js";
import { updateSubscriptionLine } from "../controller/subscriptionLines/updateSubscriptionLIne.js";
import { deleteSubscriptionLine } from "../controller/subscriptionLines/deleteSubscriptionLine.js";

export const subscriptionLineRouter = express.Router();

subscriptionLineRouter.post(
  "/subscriptions/:id/lines",
  allowedRole(["admin", "super_admin"]),
  createSubscriptionLine
);

subscriptionLineRouter.put(
  "/subscription-lines/:id",
  allowedRole(["admin", "super_admin"]),
  updateSubscriptionLine
);

subscriptionLineRouter.delete(
  "/subscription-lines/:id",
  allowedRole(["admin", "super_admin"]),
  deleteSubscriptionLine

);

export default subscriptionLineRouter;
