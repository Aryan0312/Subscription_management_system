import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { sendMailAsync } from "../../utils/sendMailAsync.js";

export const handlePasswordResetVerifyOtp = asyncHandler(
  async (req: Request, res: Response) => {

    if(!req.body || !req.body.email || !req.body.otp){
        throw new ApiError(400, "Email and OTP are required");
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }
    
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1️⃣ Get user
      const userResult = await client.query(
        `SELECT user_id FROM users WHERE email = $1`,
        [email]
      );

      if (!(userResult.rowCount ?? 0)) {
        throw new ApiError(400, "Invalid OTP");
      }

      const userId = userResult.rows[0].user_id;

      // 2️⃣ Get latest active OTP
      const otpResult = await client.query(
        `
        SELECT otp_id, otp_hash, attempts, max_attempts
        FROM password_reset_otps
        WHERE user_id = $1
          AND used_at IS NULL
          AND expires_at > now()
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
        `,
        [userId]
      );

      if (!(otpResult.rowCount ?? 0)) {
        throw new ApiError(400, "OTP expired or invalid");
      }

      const otpRow = otpResult.rows[0];

      // 3️⃣ Check attempt limit
      if (otpRow.attempts >= otpRow.max_attempts) {
        throw new ApiError(403, "Too many invalid OTP attempts");
      }

      // 4️⃣ Verify OTP
      const isValidOtp = await bcrypt.compare(
        otp.toString(),
        otpRow.otp_hash
      );

      if (!isValidOtp) {
        await client.query(
          `
          UPDATE password_reset_otps
          SET attempts = attempts + 1
          WHERE otp_id = $1
          `,
          [otpRow.otp_id]
        );

        throw new ApiError(400, "Invalid OTP");
      }

      // 5️⃣ Generate new password
      const newPassword = crypto.randomBytes(4).toString("hex"); // 8 chars
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // 6️⃣ Update password
      await client.query(
        `
        UPDATE user_credentials
        SET password = $1
        WHERE user_id = $2
        `,
        [hashedPassword, userId]
      );

      // 7️⃣ Mark OTP as used
      await client.query(
        `
        UPDATE password_reset_otps
        SET used_at = now()
        WHERE otp_id = $1
        `,
        [otpRow.otp_id]
      );

      await client.query("COMMIT");

      // 8️⃣ Email new password
       sendMailAsync(
        email,
         "Your New Password",
        `<p>Your password has been reset.</p>
          <p><strong>New password:</strong></p>
          <h3>${newPassword}</h3>
          <p>Please log in and change it immediately.</p>
        `);

      res.status(200).json({
        success: true,
        message: "Password reset successful. New password sent to email.",
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
);
