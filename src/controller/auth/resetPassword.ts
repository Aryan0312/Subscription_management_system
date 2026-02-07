import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { validateEmail } from "../../utils/sanitize.js";
import { pool } from "../../config/db.js";
import { generateRandomPassword } from "../../utils/generateRandomPassword.js";
import bcrypt from "bcrypt";
import { sendMailAsync } from "../../utils/sendMailAsync.js";


const SALT_ROUNDS = 12;

    export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {

      if (!req.body) {
            throw new ApiError(400, "Send valid fields!");
        }

    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const sanitizedEmail = validateEmail(email);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1️⃣ Find user
      const userResult = await client.query(
        `
        SELECT user_id, fname
        FROM users
        WHERE email = $1
        `,
        [sanitizedEmail]
      );

      if (userResult.rowCount === 0) {
        throw new ApiError(404, "User not found");
      }

      const { user_id, fname } = userResult.rows[0];

      // 2️⃣ Generate new password
      const newPassword = generateRandomPassword();

      // 3️⃣ Hash it
      const hashedPassword = await bcrypt.hash(
        newPassword,
        SALT_ROUNDS
      );

      // 4️⃣ Update DB
      await client.query(
        `
        UPDATE user_credentials
        SET password = $1
        WHERE user_id = $2
        `,
        [hashedPassword, user_id]
      );

      await client.query("COMMIT");

      // 5️⃣ Send email
      const emailMessage = `
        <h2>Password Reset Successful 🔐</h2>

        <p>Hi ${fname || "User"},</p>

        <p>Your password has been reset.</p>

        <p><strong>New Temporary Password:</strong></p>
        <p style="font-size: 18px; font-weight: bold;">
          ${newPassword}
        </p>

        <p>
          Please log in using this password and
          <strong>change it immediately</strong>.
        </p>

        <p>If you did not request this reset, contact support.</p>

        <br/>
        <p>— SakshyaSetu Team</p>
      `;

      await sendMailAsync(
        sanitizedEmail,
        "Your Password Has Been Reset",
        emailMessage
      );

      res.status(200).json({
        success: true,
        message: "Password reset and email sent successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
);
