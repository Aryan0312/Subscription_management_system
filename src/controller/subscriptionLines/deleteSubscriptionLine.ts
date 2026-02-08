// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const deleteSubscriptionLine = asyncHandler(
  async (req: Request, res: Response) => {

    const lineId = Number(req.params.id);

    if (!lineId) {
      throw new ApiError(400, "Invalid subscription line id");
    }

    const result = await pool.query(
      `
      DELETE FROM subscription_lines
      WHERE subscription_line_id = $1
      RETURNING *
      `,
      [lineId]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Subscription line not found");
    }

    res.status(200).json({
      success: true,
      message: "Subscription line deleted successfully"
    });
  }
);
