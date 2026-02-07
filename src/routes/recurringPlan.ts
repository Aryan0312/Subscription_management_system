// @ts-check

import express from "express";
import { createRecurringPlan } from "../controller/recurringPlans/createRecurringPlan.js";
import { allowedRole } from "../middleware/auth/authMiddleware.js";

export const recurringPlanRouter = express.Router();

/**
 * POST /recurring-plans
 * Create a recurring plan
 * Access: admin, super_admin
 */
recurringPlanRouter.post(
  "/",
  allowedRole(["admin", "super_admin"]),
  createRecurringPlan
);

export default recurringPlanRouter;
