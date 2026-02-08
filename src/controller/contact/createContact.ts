// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { getCreatedBy } from "../../utils/getCreatedBy.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const createContact = asyncHandler(
  async (req: Request, res: Response) => {

    const {
      company_name,
      billing_address,
      shipping_address,
      tax_id,
      is_customer
    } = req.body;

    // BODY RULE
    if (!company_name || typeof is_customer !== "boolean") {
      throw new ApiError(400, "company_name and is_customer are required");
    }

    const createdBy = getCreatedBy(req);

    const result = await pool.query(
      `
      INSERT INTO contacts
      (
        user_id,
        company_name,
        billing_address,
        shipping_address,
        tax_id,
        is_customer
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        createdBy,
        trimString(company_name),
        billing_address ?? null,
        shipping_address ?? null,
        tax_id ?? null,
        is_customer
      ]
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: result.rows[0]
    });
  }
);
