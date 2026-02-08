// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const deleteQuotation = asyncHandler(
  async (req: Request, res: Response) => {

    const templateId = Number(req.params.id);

    if (!templateId || Number.isNaN(templateId)) {
      throw new ApiError(400, "Invalid template_id");
    }

    const result = await pool.query(
      `DELETE FROM quotation_templates WHERE template_id = $1 RETURNING *`,
      [templateId]
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Quotation template not found");
    }

    res.status(200).json({
      success: true,
      message: "Quotation template deleted successfully"
    });
  }
);
