// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

/**
 * Create product-plan price mapping
 */
export const createProductPlanPrice = asyncHandler(
  async (req: Request, res: Response) => {

    // 1️⃣ BODY RULE — all fields must be present

    if(!req.body){
        throw new ApiError(400, "All fields are required");
    }
    if (
      !req.body.product_id ||
      !req.body.plan_id ||
      !req.body.price ||
      !req.body.min_quantity ||
      !req.body.start_date ||
      !("end_date" in req.body)
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // 2️⃣ Read & normalize
    const product_id = Number(req.body.product_id);
    const plan_id = Number(req.body.plan_id);
    const price = Number(req.body.price);
    const min_quantity = Number(req.body.min_quantity);

    const start_date = trimString(req.body.start_date);
    const end_date =
      req.body.end_date === null
        ? null
        : trimString(req.body.end_date);

    // 3️⃣ Type & value validation
    if (
      Number.isNaN(product_id) ||
      Number.isNaN(plan_id) ||
      Number.isNaN(price) ||
      Number.isNaN(min_quantity)
    ) {
      throw new ApiError(400, "Invalid numeric values");
    }

    if (price <= 0) {
      throw new ApiError(400, "price must be greater than 0");
    }

    if (min_quantity < 1) {
      throw new ApiError(400, "min_quantity must be at least 1");
    }

    // 4️⃣ Date validation
    if (end_date && new Date(start_date) > new Date(end_date)) {
      throw new ApiError(400, "start_date cannot be after end_date");
    }

    // 5️⃣ Ensure product exists
    const productCheck = await pool.query(
      `SELECT 1 FROM products WHERE product_id = $1`,
      [product_id]
    );

    if ((productCheck.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Product not found");
    }

    // 6️⃣ Ensure plan exists
    const planCheck = await pool.query(
      `SELECT 1 FROM recurring_plans WHERE plan_id = $1`,
      [plan_id]
    );

    if ((planCheck.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Recurring plan not found");
    }

    // 7️⃣ Insert mapping (NO created_by)
    const result = await pool.query(
      `
      INSERT INTO product_plan_prices
      (
        product_id,
        plan_id,
        price,
        min_quantity,
        start_date,
        end_date,
        created_at
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
      `,
      [
        product_id,
        plan_id,
        price,
        min_quantity,
        start_date,
        end_date
      ]
    );

    // 8️⃣ Response
    res.status(201).json({
      success: true,
      message: "Product plan price created successfully",
      data: result.rows[0]
    });
  }
);
