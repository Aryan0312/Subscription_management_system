// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";
import { getCreatedBy } from "../../utils/getCreatedBy.js";

export const createTax = asyncHandler(
  async (req: Request, res: Response) => {

    // BODY RULE
    if (
      !req.body.name ||
      !req.body.calculation_type ||
      req.body.value === undefined ||
      !req.body.region ||
      typeof req.body.is_active !== "boolean"
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const name = trimString(req.body.name);
    const calculation_type = trimString(req.body.calculation_type);
    const value = Number(req.body.value);
    const region = trimString(req.body.region);
    const is_active = req.body.is_active;
    const createdBy = getCreatedBy(req);

    if (!["PERCENTAGE", "FIXED"].includes(calculation_type)) {
      throw new ApiError(400, "Invalid calculation_type");
    }

    if (value <= 0) {
      throw new ApiError(400, "value must be greater than 0");
    }

    const result = await pool.query(
      `
      INSERT INTO taxes
      (name, calculation_type, value, region, is_active, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [name, calculation_type, value, region, is_active, createdBy]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  }
);
