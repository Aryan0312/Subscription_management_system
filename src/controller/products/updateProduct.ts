// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

/**
 * Update product
 */
export const updateProduct = asyncHandler(async (req:Request, res:Response) => {
  // 1️⃣ Validate product_id
  const rawId =
    typeof req.params.product_id === "string"
      ? trimString(req.params.product_id)
      : undefined;

  const productId = rawId ? Number(rawId) : NaN;

  if (!productId || Number.isNaN(productId)) {
    console.log(productId);
      productId
    throw new ApiError(400, "Invalid product ID");
  }

  // 2️⃣ Fetch existing product
  const productResult = await pool.query(
    `
    SELECT *
    FROM products
    WHERE product_id = $1
    `,
    [productId]
  );

  if (productResult.rowCount === 0) {
    throw new ApiError(404, "Product not found");
  }

  const existingProduct = productResult.rows[0];

  // 3️⃣ Check if product is used in ACTIVE subscriptions
  const usageResult = await pool.query(
    `
    SELECT 1
    FROM subscription_lines sl
    JOIN subscriptions s ON s.subscription_id = sl.subscription_id
    WHERE sl.product_id = $1
      AND s.status = 'ACTIVE'
    LIMIT 1
    `,
    [productId]
  );

  const usedInActiveSubscriptions = (usageResult.rowCount ?? 0) > 0;

  // 4️⃣ Read & sanitize inputs (inline narrowing)
  const name =
    typeof req.body.name === "string"
      ? trimString(req.body.name)
      : undefined;

  const type =
    typeof req.body.type === "string"
      ? trimString(req.body.type)
      : undefined;

  const sales_price =
    typeof req.body.sales_price === "number"
      ? req.body.sales_price
      : undefined;

  const cost_price =
    typeof req.body.cost_price === "number"
      ? req.body.cost_price
      : undefined;

  const is_recurring =
    typeof req.body.is_recurring === "boolean"
      ? req.body.is_recurring
      : undefined;

  const status =
    typeof req.body.status === "string"
      ? trimString(req.body.status)
      : undefined;

  // 5️⃣ Block restricted updates if product is active in subscriptions
  if (usedInActiveSubscriptions) {
    if (
      sales_price !== undefined ||
      cost_price !== undefined ||
      type !== undefined ||
      is_recurring !== undefined
    ) {
      throw new ApiError(
        409,
        "Product is used in active subscriptions. Pricing or structural changes are not allowed."
      );
    }
  }

  // 6️⃣ Build dynamic UPDATE query
  const fields = [];
  const values = [];

  if (name !== undefined) {
    values.push(name);
    fields.push(`name = $${values.length}`);
  }

  if (type !== undefined) {
    values.push(type);
    fields.push(`type = $${values.length}`);
  }

  if (sales_price !== undefined) {
    if (sales_price < 0) {
      throw new ApiError(400, "Sales price cannot be negative");
    }
    values.push(sales_price);
    fields.push(`sales_price = $${values.length}`);
  }

  if (cost_price !== undefined) {
    if (cost_price < 0) {
      throw new ApiError(400, "Cost price cannot be negative");
    }
    values.push(cost_price);
    fields.push(`cost_price = $${values.length}`);
  }

  if (is_recurring !== undefined) {
    values.push(is_recurring);
    fields.push(`is_recurring = $${values.length}`);
  }

  if (status !== undefined) {
    values.push(status);
    fields.push(`status = $${values.length}`);
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  values.push(productId);

  // 7️⃣ Execute update
  const updateResult = await pool.query(
    `
    UPDATE products
    SET ${fields.join(", ")},
        updated_at = NOW()
    WHERE product_id = $${values.length}
    RETURNING *
    `,
    values
  );

  // 8️⃣ Response
  res.status(200).json({
    success: true,
    data: updateResult.rows[0]
  });
});
