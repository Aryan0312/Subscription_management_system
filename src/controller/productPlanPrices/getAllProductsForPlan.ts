// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

/**
 * Get all products mapped to a recurring plan
 */
export const getProductsByRecurringPlan = asyncHandler(
  async (req: Request, res: Response) => {

    // 1️⃣ Validate plan_id
    if (!req.params.id) {
      throw new ApiError(400, "id is required");
    }

    const planId = Number(req.params.id);

    if (!planId || Number.isNaN(planId)) {
      throw new ApiError(400, "Invalid id");
    }

    // 2️⃣ Ensure plan exists
    const planCheck = await pool.query(
      `SELECT 1 FROM recurring_plans WHERE plan_id = $1`,
      [planId]
    );

    if (planCheck.rowCount === 0) {
      throw new ApiError(404, "Recurring plan not found");
    }

    // 3️⃣ Fetch mapped products
    const result = await pool.query(
      `
      SELECT DISTINCT
        p.product_id,
        p.name,
        p.type,
        p.sales_price,
        p.cost_price,
        p.is_recurring
      FROM product_plan_prices ppp
      JOIN products p
        ON p.product_id = ppp.product_id
      WHERE ppp.plan_id = $1
      ORDER BY p.name ASC
      `,
      [planId]
    );

    // 4️⃣ Response
    res.status(200).json({
      success: true,
      data: result.rows
    });
  }
);
