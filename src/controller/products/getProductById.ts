// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {

    // 1️⃣ Validate product_id
    const rawId =
      typeof req.params.id === "string"
        ? trimString(req.params.id)
        : undefined;

    const productId = rawId ? Number(rawId) : NaN;

    if (!productId || Number.isNaN(productId)) {
      throw new ApiError(400, "Invalid product ID");
    }

    // 2️⃣ Fetch product
    const productResult = await pool.query(
      `
      SELECT
        product_id,
        name,
        type,
        sales_price,
        is_recurring,
        status
      FROM products
      WHERE product_id = $1
      `,
      [productId]
    );

    if (productResult.rowCount === 0) {
      throw new ApiError(404, "Product not found");
    }

    const product = productResult.rows[0];

    // 3️⃣ Access control
    if (req.session.user?.role === "user" && product.status !== "ACTIVE") {
      throw new ApiError(403, "You are not allowed to access this product");
    }

    // 4️⃣ Fetch plan + pricing details (EXACT FIELDS)
    const pricingResult = await pool.query(
      `
      SELECT
        rp.plan_id,
        rp.name AS plan_name,
        rp.billing_period,

        ppp.min_quantity,
        ppp.price,
        ppp.start_date,
        ppp.end_date
      FROM product_plan_prices ppp
      JOIN recurring_plans rp
        ON rp.plan_id = ppp.plan_id
      WHERE ppp.product_id = $1
      ORDER BY rp.plan_id, ppp.min_quantity ASC
      `,
      [productId]
    );

    // 5️⃣ Response
    res.status(200).json({
      success: true,
      data: {
        product: {
          product_id: product.product_id,
          name: product.name,
          type: product.type,
          sales_price: product.sales_price,
          is_recurring: product.is_recurring
        },
        plans: pricingResult.rows
      }
    });
  }
);
