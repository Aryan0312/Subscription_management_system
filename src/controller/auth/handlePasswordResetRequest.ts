import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { validateEmail } from "../../utils/sanitize.js";
import { sendMailAsync } from "../../utils/sendMailAsync.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

export const handlePasswordResetRequest = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.body || !req.body.email) {
      throw new ApiError(400, "Email is required");
    }

    const email = validateEmail(req.body.email);
    const client = await pool.connect();

    try {
      // 🔍 Find user (DO NOT reveal result)
      const userResult = await client.query(
        `SELECT user_id,email FROM users WHERE email = $1`,
        [email]
      );

      

      if (userResult.rowCount) {
        const userId = userResult.rows[0].user_id;
        const userEmail = userResult.rows[0].email;

        const otp = Math.floor(1000 + Math.random() * 9000);

        const otpHash = await bcrypt.hash(otp.toString(), 10);

        const expiresAt = new Date(
          Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
        );


        await client.query(
          `
          INSERT INTO password_reset_otps
            (user_id, otp_hash, expires_at)
          VALUES
            ($1, $2, $3)
          `,
          [userId, otpHash, expiresAt]
        );

        sendMailAsync(email,"Recuro | Password Reset OTP",`
                          <p>Your password reset OTP is:</p>

                          <h2>${otp}</h2>

                          <p>This OTP is valid for 10 minutes.</p>

                          <p>If you did not request this, you can ignore this email.</p>
                        `)
      }

      // ALWAYS return same response
      res.status(200).json({
        success: true,
        message:
          "If an account exists, a password reset OTP has been sent to the registered email.",
      });

    } finally {
      client.release();
    }
  }
);
