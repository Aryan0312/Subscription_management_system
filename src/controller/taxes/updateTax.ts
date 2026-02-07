// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const updateTax = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.params.tax_id) {
      throw new ApiError(400, "tax_id is required");
    }

    if (
      !req.body.name &&
      !req.body.calculation_type &&
      req.body.value === undefined &&
      req.body.is_active === undefined
    ) {
      throw new ApiError(400, "At least one field is required");
    }

    const taxId = Number(req.params.tax_id);

    if (!taxId || Number.isNaN(taxId)) {
      throw new ApiError(400, "Invalid tax_id");
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (req.body.name) {
      values.push(trimString(req.body.name));
      fields.push(`name = $${values.length}`);
    }

    if (req.body.calculation_type) {
      const type = trimString(req.body.calculation_type);
      if (!["PERCENTAGE", "FIXED"].includes(type)) {
        throw new ApiError(400, "Invalid calculation_type");
      }
      values.push(type);
      fields.push(`calculation_type = $${values.length}`);
    }

    if (req.body.value !== undefined) {
      const value = Number(req.body.value);
      if (value <= 0) {
        throw new ApiError(400, "value must be greater than 0");
      }
      values.push(value);
      fields.push(`value = $${values.length}`);
    }

    if (typeof req.body.is_active === "boolean") {
      values.push(req.body.is_active);
      fields.push(`is_active = $${values.length}`);
    }

    values.push(taxId);

    const result = await pool.query(
      `
      UPDATE taxes
      SET ${fields.join(", ")}
      WHERE tax_id = $${values.length}
      RETURNING *
      `,
      values
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Tax not found");
    }

    res.status(200).json({
      success: true,
      message: "Tax updated successfully"
    });
  }
);
