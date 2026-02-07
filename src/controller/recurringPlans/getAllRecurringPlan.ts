// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";

/**
 * Get all recurring plans
 */
export const getAllRecurringPlans = asyncHandler(
  async (_req: Request, res: Response) => {

    const result = await pool.query(
      `
      SELECT
        plan_id,
        name,
        billing_period,
        auto_close_after_days,
        is_closable,
        is_pausable,
        is_renewable
      FROM recurring_plans
      ORDER BY created_at ASC
      `
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  }
);
