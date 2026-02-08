// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const updateSubscriptionStatus = asyncHandler(
  async (req: Request, res: Response) => {

    const subscriptionId = Number(req.params.id);
    const { status } = req.body;

    // BODY RULE
    if (!subscriptionId || !status) {
      throw new ApiError(400, "subscription id and status are required");
    }

    const result = await pool.query(
      `
      UPDATE subscriptions
      SET
        status = $1,
        updated_at = NOW()
      WHERE subscription_id = $2
      RETURNING *
      `,
      [status, subscriptionId]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Subscription not found");
    }

    res.status(200).json({
      success: true,
      message: "Subscription status updated successfully",
      data: result.rows[0]
    });
  }
);
