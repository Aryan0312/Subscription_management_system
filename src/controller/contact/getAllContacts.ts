// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";

export const getAllContacts = asyncHandler(
  async (req: Request, res: Response) => {

    const isCustomer = req.query.is_customer === "true";

    const result = await pool.query(
      `
      SELECT
        contact_id,
        company_name,
        billing_address,
        shipping_address,
        tax_id,
        is_customer,
        created_at
      FROM contacts
      WHERE is_customer = $1
      ORDER BY created_at DESC
      `,
      [isCustomer]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  }
);
