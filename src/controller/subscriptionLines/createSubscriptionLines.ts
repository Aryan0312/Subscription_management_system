    // @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const createSubscriptionLine = asyncHandler(
  async (req: Request, res: Response) => {

    const subscriptionId = Number(req.params.id);
    const { product_id, quantity, unit_price, variant_value_ids, tax_ids } = req.body;

    if (
      !subscriptionId ||
      !product_id ||
      !quantity ||
      unit_price === undefined
    ) {
      throw new ApiError(400, "All required fields are missing");
    }

    const result = await pool.query(
      `
      INSERT INTO subscription_lines
      (subscription_id, product_id, quantity, unit_price)
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [subscriptionId, product_id, quantity, unit_price]
    );

    const lineId = result.rows[0].subscription_line_id;

    // Variants
    if (Array.isArray(variant_value_ids)) {
      for (const vId of variant_value_ids) {
        await pool.query(
          `
          INSERT INTO subscription_line_variants
          (subscription_line_id, attribute_value_id)
          VALUES ($1,$2)
          `,
          [lineId, vId]
        );
      }
    }

    // Taxes
    if (Array.isArray(tax_ids)) {
      for (const taxId of tax_ids) {
        await pool.query(
          `
          INSERT INTO subscription_line_taxes
          (subscription_line_id, tax_id)
          VALUES ($1,$2)
          `,
          [lineId, taxId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Subscription line added successfully",
      data: result.rows[0]
    });
  }
);
