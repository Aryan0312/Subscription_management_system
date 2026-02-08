// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { getCreatedBy } from "../../utils/getCreatedBy.js";
import { Request, Response } from "express";

/**
 * 1️⃣ Create Discount
 */
export const createDiscount = asyncHandler(
  async (req: Request, res: Response) => {

    if (
      !req.body.name ||
      !req.body.type ||
      req.body.value === undefined ||
      req.body.min_purchase === undefined ||
      req.body.min_quantity === undefined ||
      !req.body.start_date ||
      !req.body.end_date
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const name = trimString(req.body.name);
    const type = trimString(req.body.type);
    const value = Number(req.body.value);
    const min_purchase = Number(req.body.min_purchase);
    const min_quantity = Number(req.body.min_quantity);
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    const createdBy = getCreatedBy(req);

    if (!["FIXED", "PERCENTAGE"].includes(type)) {
      throw new ApiError(400, "Invalid discount type");
    }

    if (value <= 0) throw new ApiError(400, "value must be > 0");
    if (min_purchase < 0) throw new ApiError(400, "min_purchase must be ≥ 0");
    if (min_quantity < 1) throw new ApiError(400, "min_quantity must be ≥ 1");
    if (new Date(start_date) > new Date(end_date)) {
      throw new ApiError(400, "start_date cannot be after end_date");
    }

    const result = await pool.query(
      `
      INSERT INTO discounts
      (name, type, value, min_purchase, min_quantity, start_date, end_date, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING discount_id, name, type, value, is_active
      `,
      [
        name,
        type,
        value,
        min_purchase,
        min_quantity,
        start_date,
        end_date,
        createdBy
      ]
    );

    res.status(201).json({
      success: true,
      message: "Discount created successfully",
      data: result.rows[0]
    });
  }
);

/**
 * 2️⃣ Get All Discounts
 */
export const getAllDiscounts = asyncHandler(
  async (req: Request, res: Response) => {

    const isActive = req.query.is_active;

    let query = `
      SELECT
        discount_id,
        name,
        type,
        value,
        start_date,
        end_date,
        is_active
      FROM discounts
    `;
    const values: any[] = [];

    if (isActive !== undefined) {
      query += ` WHERE is_active = $1`;
      values.push(isActive === "true");
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  }
);

/**
 * 3️⃣ Get Discount by ID
 */
export const getDiscountById = asyncHandler(
  async (req: Request, res: Response) => {

    const discountId = Number(req.params.discount_id);

    if (!discountId || Number.isNaN(discountId)) {
      throw new ApiError(400, "Invalid discount_id");
    }

    const result = await pool.query(
      `
      SELECT
        discount_id,
        name,
        type,
        value,
        min_purchase,
        min_quantity,
        start_date,
        end_date,
        is_active
      FROM discounts
      WHERE discount_id = $1
      `,
      [discountId]
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Discount not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  }
);

/**
 * 4️⃣ Update Discount (only if not expired)
 */
export const updateDiscount = asyncHandler(
  async (req: Request, res: Response) => {

    const discountId = Number(req.params.discount_id);
    if (!discountId || Number.isNaN(discountId)) {
      throw new ApiError(400, "Invalid discount_id");
    }

    const fields: string[] = [];
    const values: any[] = [];

    const now = new Date();

    const check = await pool.query(
      `SELECT end_date FROM discounts WHERE discount_id = $1`,
      [discountId]
    );

    if ((check.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Discount not found");
    }

    if (new Date(check.rows[0].end_date) < now) {
      throw new ApiError(409, "Expired discount cannot be updated");
    }

    if (req.body.value !== undefined) {
      const v = Number(req.body.value);
      if (v <= 0) throw new ApiError(400, "value must be > 0");
      values.push(v);
      fields.push(`value = $${values.length}`);
    }

    if (req.body.end_date) {
      values.push(req.body.end_date);
      fields.push(`end_date = $${values.length}`);
    }

    if (fields.length === 0) {
      throw new ApiError(400, "No valid fields provided");
    }

    values.push(discountId);

    await pool.query(
      `
      UPDATE discounts
      SET ${fields.join(", ")}
      WHERE discount_id = $${values.length}
      `,
      values
    );

    res.status(200).json({
      success: true,
      message: "Discount updated successfully"
    });
  }
);

/**
 * 5️⃣ Activate / Deactivate Discount
 */
export const updateDiscountStatus = asyncHandler(
  async (req: Request, res: Response) => {

    if (typeof req.body.is_active !== "boolean") {
      throw new ApiError(400, "is_active is required");
    }

    const discountId = Number(req.params.discount_id);

    await pool.query(
      `
      UPDATE discounts
      SET is_active = $1
      WHERE discount_id = $2
      `,
      [req.body.is_active, discountId]
    );

    res.status(200).json({
      success: true,
      message: "Discount status updated"
    });
  }
);

/**
 * 6️⃣ Validate Discount (INTERNAL)
 */
export const validateDiscount = asyncHandler(
  async (req: Request, res: Response) => {

    const {
      discount_id,
      order_amount,
      total_quantity,
      date
    } = req.body;

    if (
      !discount_id ||
      order_amount === undefined ||
      total_quantity === undefined ||
      !date
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM discounts
      WHERE discount_id = $1 AND is_active = true
      `,
      [discount_id]
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.json({ valid: false, reason: "Discount inactive or not found" });
    }

    const d = result.rows[0];

    if (new Date(date) < d.start_date || new Date(date) > d.end_date) {
      return res.json({ valid: false, reason: "Discount not valid on this date" });
    }

    if (order_amount < d.min_purchase) {
      return res.json({ valid: false, reason: "Minimum purchase not met" });
    }

    if (total_quantity < d.min_quantity) {
      return res.json({ valid: false, reason: "Minimum quantity not met" });
    }

    res.json({
      valid: true,
      discount_type: d.type,
      discount_value: d.value
    });
  }
);
