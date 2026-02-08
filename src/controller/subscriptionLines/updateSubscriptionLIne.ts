// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const updateSubscriptionLine = asyncHandler(
  async (req: Request, res: Response) => {

    const lineId = Number(req.params.id);
    const { quantity, unit_price } = req.body;

    if (!lineId) {
      throw new ApiError(400, "Invalid subscription line id");
    }

    if (quantity === undefined && unit_price === undefined) {
      throw new ApiError(400, "At least one field is required");
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (quantity !== undefined) {
      values.push(quantity);
      fields.push(`quantity = $${values.length}`);
    }

    if (unit_price !== undefined) {
      values.push(unit_price);
      fields.push(`unit_price = $${values.length}`);
    }

    values.push(lineId);

    const result = await pool.query(
      `
      UPDATE subscription_lines
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE subscription_line_id = $${values.length}
      RETURNING *
      `,
      values
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Subscription line not found");
    }

    res.status(200).json({
      success: true,
      message: "Subscription line updated successfully",
      data: result.rows[0]
    });
  }
);
