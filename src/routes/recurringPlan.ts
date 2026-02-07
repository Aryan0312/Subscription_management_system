// @ts-check

import express from "express";
import { createRecurringPlan } from "../controller/recurringPlans/createRecurringPlan.js";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { getAllRecurringPlans } from "../controller/recurringPlans/getAllRecurringPlan.js";

export const recurringPlanRouter = express.Router();

recurringPlanRouter.post(
  "/",
  allowedRole(["admin", "super_admin"]),
  createRecurringPlan
);

recurringPlanRouter.get(
  "/",
  allowedRole(["admin", "super_admin","user"]),
  getAllRecurringPlans
);

export default recurringPlanRouter;
