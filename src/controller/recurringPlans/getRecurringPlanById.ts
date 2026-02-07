// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

/**
 * Get recurring plan by ID
 */
export const getRecurringPlanById = asyncHandler(
  async (req: Request, res: Response) => {

    // 1️⃣ Validate plan_id
    if (!req.params.id) {
      throw new ApiError(400, "plan_id is required");
    }

    const planId = Number(req.params.id);

    if (!planId || Number.isNaN(planId)) {
      throw new ApiError(400, "Invalid plan_id");
    }

    // 2️⃣ Fetch plan
    const result = await pool.query(
      `
      SELECT
        plan_id,
        name,
        billing_period,
        auto_close_after_days,
        is_closable,
        is_pausable,
        is_renewable,
        created_at,
        updated_at
      FROM recurring_plans
      WHERE plan_id = $1
      `,
      [planId]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Recurring plan not found");
    }

    // 3️⃣ Response
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  }
);
