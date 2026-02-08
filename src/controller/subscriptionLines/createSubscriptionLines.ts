    // @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const createSubscriptionLine = asyncHandler(
  async (req: Request, res: Response) => {

    const subscriptionId = Number(req.params.id);
    const { product_id, quantity, unit_price, tax_id, discount_id } = req.body;

    if (
      !subscriptionId ||
      !product_id ||
      !quantity ||
      unit_price === undefined
    ) {
      throw new ApiError(400, "All required fields are missing");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verify subscription exists
      const subCheck = await client.query(
        `SELECT 1 FROM subscriptions WHERE subscription_id = $1`,
        [subscriptionId]
      );

      if ((subCheck.rowCount ?? 0) === 0) {
        throw new ApiError(404, "Subscription not found");
      }

      // Verify product exists
      const productCheck = await client.query(
        `SELECT 1 FROM products WHERE product_id = $1`,
        [product_id]
      );

      if ((productCheck.rowCount ?? 0) === 0) {
        throw new ApiError(404, "Product not found");
      }

      // Calculate amount (quantity * unit_price)
      const amount = quantity * unit_price;

      const result = await client.query(
        `
        INSERT INTO subscription_lines
        (subscription_id, product_id, quantity, unit_price, tax_id, discount_id, amount)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          subscriptionId,
          product_id,
          quantity,
          unit_price,
          tax_id ?? null,
          discount_id ?? null,
          amount
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Subscription line added successfully",
        data: result.rows[0]
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
);
