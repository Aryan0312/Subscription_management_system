import express from "express";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { updateSubscriptionStatus } from "../controller/subscription/updateSubscription.js";
import { createSubscription } from "../controller/subscription/createSubscription.js";
import { getAllSubscriptions } from "../controller/subscription/getAllSubscriptions.js";

export const subscriptionRouter = express.Router();

subscriptionRouter.get(
  "/",
  allowedRole(["admin", "super_admin"]),
  getAllSubscriptions
);

subscriptionRouter.post(
  "/",
  allowedRole(["admin", "super_admin"]),
  createSubscription
);

subscriptionRouter.put(
  "/:id/status",
  allowedRole(["admin", "super_admin"]),
  updateSubscriptionStatus
);

export default subscriptionRouter;
