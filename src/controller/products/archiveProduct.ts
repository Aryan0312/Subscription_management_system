// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

/**
 * Archive product (soft delete)
 */
export const archiveProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const rawId =
      typeof req.params.product_id === "string"
        ? trimString(req.params.product_id)
        : undefined;

    const productId = rawId ? Number(rawId) : NaN;

    if (!productId || Number.isNaN(productId)) {
      throw new ApiError(400, "Invalid product ID");
    }

    // 2️⃣ Fetch product
    const productResult = await pool.query(
      `
      SELECT product_id, status
      FROM products
      WHERE product_id = $1
      `,
      [productId]
    );

    if (productResult.rowCount === 0) {
      throw new ApiError(404, "Product not found");
    }

    const product = productResult.rows[0];

    // 3️⃣ Already archived?
    if (product.status === "ARCHIVED") {
      throw new ApiError(409, "Product is already archived");
    }

    // 4️⃣ Check usage in ACTIVE subscriptions
    const usageResult = await pool.query(
      `
      SELECT 1
      FROM subscription_lines sl
      JOIN subscriptions s
        ON s.subscription_id = sl.subscription_id
      WHERE sl.product_id = $1
        AND s.status = 'ACTIVE'
      LIMIT 1
      `,
      [productId]
    );

    if ((usageResult.rowCount ?? 0) > 0) {
      throw new ApiError(
        409,
        "Product is used in active subscriptions and cannot be archived"
      );
    }

    // 5️⃣ Archive product
    const archiveResult = await pool.query(
      `
      UPDATE products
      SET status = 'ARCHIVED',
          updated_at = NOW()
      WHERE product_id = $1
      RETURNING *
      `,
      [productId]
    );

    // 6️⃣ Response
    res.status(200).json({
      success: true,
      message: "Product archived successfully",
      data: archiveResult.rows[0]
    });
  }
);
