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
        c.contact_id,
        c.company_name,
        c.billing_address,
        c.shipping_address,
        c.tax_id,
        c.is_customer,
        c.created_at,
        u.user_id,
        u.email,
        u.fname,
        u.lname,
        u.phone
      FROM contacts c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.is_customer = $1
      ORDER BY c.created_at DESC
      `,
      [isCustomer]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  }
);
