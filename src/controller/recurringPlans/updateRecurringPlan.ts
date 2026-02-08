// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { getCreatedBy } from "../../utils/getCreatedBy.js";
import { Request, Response } from "express";

/**
 * Update recurring plan
 */
export const updateRecurringPlan = asyncHandler(
  async (req: Request, res: Response) => {

    // 1️⃣ Validate plan_id
    if (!req.params.id) {
      throw new ApiError(400, "plan_id is required");
    }

    const planId = Number(req.params.id);

    if (!planId || Number.isNaN(planId)) {
      throw new ApiError(400, "Invalid plan_id");
    }

    // 2️⃣ BODY RULE — all fields must be present
    if (
      !req.body.name ||
      !req.body.billing_period ||
      !("auto_close_after_days" in req.body) ||
      typeof req.body.is_closable !== "boolean" ||
      typeof req.body.is_pausable !== "boolean" ||
      typeof req.body.is_renewable !== "boolean"
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // 3️⃣ Read & sanitize
    const name = trimString(req.body.name);
    const billing_period = trimString(req.body.billing_period);

    const auto_close_after_days =
      req.body.auto_close_after_days === null
        ? null
        : Number(req.body.auto_close_after_days);

    const is_closable = req.body.is_closable;
    const is_pausable = req.body.is_pausable;
    const is_renewable = req.body.is_renewable;

    // 4️⃣ Enum validation
    const allowedBillingPeriods = [
      "DAILY",
      "WEEKLY",
      "MONTHLY",
      "YEARLY"
    ];

    if (!allowedBillingPeriods.includes(billing_period)) {
      throw new ApiError(400, "Invalid billing_period");
    }

    // 5️⃣ auto_close_after_days validation
    if (
      auto_close_after_days !== null &&
      (Number.isNaN(auto_close_after_days) || auto_close_after_days <= 0)
    ) {
      throw new ApiError(
        400,
        "auto_close_after_days must be a positive number or null"
      );
    }

    // 6️⃣ Ensure plan exists
    const planCheck = await pool.query(
      `SELECT 1 FROM recurring_plans WHERE plan_id = $1`,
      [planId]
    );

    if ((planCheck.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Recurring plan not found");
    }


    // 8️⃣ Update plan
    const result = await pool.query(
      `
      UPDATE recurring_plans
      SET
        name = $1,
        billing_period = $2,
        auto_close_after_days = $3,
        is_closable = $4,
        is_pausable = $5,
        is_renewable = $6
      WHERE plan_id = $7
      RETURNING *
      `,
      [
        name,
        billing_period,
        auto_close_after_days,
        is_closable,
        is_pausable,
        is_renewable,
        planId
      ]
    );

    // 9️⃣ Response
    res.status(200).json({
      success: true,
      message: "Recurring plan updated successfully",
      data: result.rows[0]
    });
  }
);
