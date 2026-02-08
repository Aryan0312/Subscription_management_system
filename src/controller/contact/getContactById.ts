// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const getContactById = asyncHandler(
  async (req: Request, res: Response) => {

    const contactId = Number(req.params.id);

    if (!contactId) {
      throw new ApiError(400, "Invalid contact id");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM contacts
      WHERE contact_id = $1
      `,
      [contactId]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Customer not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  }
);
    