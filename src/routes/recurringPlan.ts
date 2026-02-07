// @ts-check

import express from "express";
import { createRecurringPlan } from "../controller/recurringPlans/createRecurringPlan.js";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { getAllRecurringPlans } from "../controller/recurringPlans/getAllRecurringPlan.js";
import { getRecurringPlanById } from "../controller/recurringPlans/getRecurringPlanById.js";
import { updateRecurringPlan } from "../controller/recurringPlans/updateRecurringPlan.js";

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

recurringPlanRouter.get(
  "/:id",
  allowedRole(["admin", "super_admin","user"]),
  getRecurringPlanById
);

recurringPlanRouter.put(
  "/:id",
  allowedRole(["admin", "super_admin","user"]),
  updateRecurringPlan
);

export default recurringPlanRouter;
