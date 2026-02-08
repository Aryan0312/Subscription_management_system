import express from "express";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { updateSubscriptionStatus } from "../controller/subscription/updateSubscription.js";
import { createSubscription } from "../controller/subscription/createSubscription.js";

export const subscriptionRouter = express.Router();

subscriptionRouter.put(
  "/:id/status",
  allowedRole(["admin", "super_admin"]),
  updateSubscriptionStatus
);

subscriptionRouter.post(
  "/",
  allowedRole(["admin", "super_admin"]),
  createSubscription
);

export default subscriptionRouter;
