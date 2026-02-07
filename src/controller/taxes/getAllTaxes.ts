// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";

export const getAllTaxes = asyncHandler(
  async (_req: Request, res: Response) => {

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
      ORDER BY name ASC
      `
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  }
);
