// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const getTaxById = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.params.tax_id) {
      throw new ApiError(400, "tax_id is required");
    }

    const taxId = Number(req.params.tax_id);

    if (!taxId || Number.isNaN(taxId)) {
      throw new ApiError(400, "Invalid tax_id");
    }

    const result = await pool.query(
      `
      SELECT
        tax_id,
        name,
        calculation_type,
        value,
        region,
        is_active
      FROM taxes
      WHERE tax_id = $1
      `,
      [taxId]
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Tax not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  }
);
