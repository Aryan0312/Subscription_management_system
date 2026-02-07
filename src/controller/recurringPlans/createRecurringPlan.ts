// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";
import { getCreatedBy } from "../../utils/getCreatedBy.js";

/**
 * Create recurring plan
 */
export const createRecurringPlan = asyncHandler(
  async (req: Request, res: Response) => {

    if(!req.body){
        throw new ApiError(400, "send valid fields");

    }

 if (!req.body.name || !req.body.billing_period) {
      throw new ApiError(400, "name and billing_period are required");
    }

    // booleans must be explicitly present
    if (
      typeof req.body.is_closable !== "boolean" ||
      typeof req.body.is_pausable !== "boolean" ||
      typeof req.body.is_renewable !== "boolean"
    ) {
      throw new ApiError(
        400,
        "is_closable, is_pausable and is_renewable must be boolean"
      );
    }

    // auto_close_after_days must exist (can be null or number)
    if (!("auto_close_after_days" in req.body)) {
      throw new ApiError(400, "auto_close_after_days is required");
    }

    const created_by = getCreatedBy(req);

    if (!created_by) {
    throw new ApiError(401, "Unauthorized");
    }


    // 2️⃣ Read & sanitize inputs
    const name =
      typeof req.body.name === "string"
        ? trimString(req.body.name)
        : undefined;

    const billing_period =
      typeof req.body.billing_period === "string"
        ? trimString(req.body.billing_period)
        : undefined;

    const auto_close_after_days =
      req.body.auto_close_after_days === null
        ? null
        : typeof req.body.auto_close_after_days === "number"
        ? req.body.auto_close_after_days
        : undefined;

    const is_closable =
      typeof req.body.is_closable === "boolean"
        ? req.body.is_closable
        : undefined;

    const is_pausable =
      typeof req.body.is_pausable === "boolean"
        ? req.body.is_pausable
        : undefined;

    const is_renewable =
      typeof req.body.is_renewable === "boolean"
        ? req.body.is_renewable
        : undefined;

    // 3️⃣ Type validation
    if (
      !name ||
      !billing_period ||
      is_closable === undefined ||
      is_pausable === undefined ||
      is_renewable === undefined
    ) {
      throw new ApiError(400, "Invalid field types");
    }

    // 4️⃣ Enum validation
    const allowedBillingPeriods = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

    if (!allowedBillingPeriods.includes(billing_period)) {
      throw new ApiError(400, "Invalid billing_period");
    }

    // 5️⃣ auto_close_after_days validation
    if (
      auto_close_after_days !== null &&
      auto_close_after_days <= 0
    ) {
      throw new ApiError(
        400,
        "auto_close_after_days must be a positive number or null"
      );
    }

    // 6️⃣ Insert recurring plan
    const result = await pool.query(
  `
  INSERT INTO recurring_plans
  (
    name,
    billing_period,
    auto_close_after_days,
    is_closable,
    is_pausable,
    is_renewable,
    created_by,
    created_at
  )
  VALUES
  ($1,$2,$3,$4,$5,$6,$7,NOW())
  RETURNING *
  `,
  [
    name,
    billing_period,
    auto_close_after_days,
    is_closable,
    is_pausable,
    is_renewable,
    created_by
  ]
);


    // 7️⃣ Response
    res.status(201).json({
      success: true,
      message: "Recurring plan created successfully",
      data: result.rows[0]
    });
  }
);
