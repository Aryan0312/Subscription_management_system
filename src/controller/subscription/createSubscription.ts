// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { getCreatedBy } from "../../utils/getCreatedBy.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const createSubscription = asyncHandler(
  async (req: Request, res: Response) => {

    const {
      subscription_number,
      customer_id,
      plan_id,
      start_date,
      payment_terms,
      discount_id
    } = req.body;

    // BODY RULE
    if (
      !subscription_number ||
      !customer_id ||
      !plan_id ||
      !start_date ||
      payment_terms === undefined
    ) {
      throw new ApiError(400, "All required fields must be provided");
    }

    const subNumber = trimString(subscription_number);
    const createdBy = getCreatedBy(req);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1️⃣ Ensure subscription_number is unique
      const existing = await client.query(
        `
        SELECT 1
        FROM subscriptions
        WHERE subscription_number = $1
        `,
        [subNumber]
      );

      if ((existing.rowCount ?? 0) > 0) {
        throw new ApiError(
          409,
          "Subscription number already exists"
        );
      }

      // 2️⃣ Create subscription
      const result = await client.query(
        `
        INSERT INTO subscriptions
        (
          subscription_number,
          customer_id,
          plan_id,
          start_date,
          payment_terms,
          discount_id,
          status,
          total_amount,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',0,$7)
        RETURNING *
        `,
        [
          subNumber,
          customer_id,
          plan_id,
          start_date,
          payment_terms,
          discount_id ?? null,
          createdBy
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Subscription created successfully",
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
