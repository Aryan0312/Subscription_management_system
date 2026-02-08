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
      payment_terms
    } = req.body;

    // ✅ BODY RULE (strict)
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
    const customerId = Number(customer_id);
    const planId = Number(plan_id);
    const paymentTerms = Number(payment_terms);
    const createdBy = getCreatedBy(req);

    if (
      Number.isNaN(customerId) ||
      Number.isNaN(planId) ||
      Number.isNaN(paymentTerms)
    ) {
      throw new ApiError(400, "Invalid numeric values");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 🔒 Ensure subscription_number is unique
      const existing = await client.query(
        `
        SELECT 1
        FROM subscriptions
        WHERE subscription_number = $1
        `,
        [subNumber]
      );

      if ((existing.rowCount ?? 0) > 0) {
        throw new ApiError(409, "Subscription number already exists");
      }

      // ✅ Verify customer exists
      const customerCheck = await client.query(
        `SELECT 1 FROM contacts WHERE contact_id = $1 AND is_customer = true`,
        [customerId]
      );

      if ((customerCheck.rowCount ?? 0) === 0) {
        throw new ApiError(404, "Customer not found");
      }

      // ✅ Verify plan exists
      const planCheck = await client.query(
        `SELECT 1 FROM recurring_plans WHERE plan_id = $1`,
        [planId]
      );

      if ((planCheck.rowCount ?? 0) === 0) {
        throw new ApiError(404, "Recurring plan not found");
      }

      // ✅ Create subscription (NO discount_id)
      const result = await client.query(
        `
        INSERT INTO subscriptions
        (
          subscription_number,
          customer_id,
          plan_id,
          start_date,
          payment_terms,
          status,
          total_amount,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,'DRAFT',0,$6)
        RETURNING *
        `,
        [
          subNumber,
          customerId,
          planId,
          start_date,
          paymentTerms,
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
