import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { createSession } from "../../service/authService.js";
import { trimString, validateEmail } from "../../utils/sanitize.js";

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 1;

// need to understand and change this 

export const handleUserLogin = asyncHandler(
  async (req: Request, res: Response) => {

    if(!req.body){
      throw new ApiError(400,"send valid email and password!");
    }

    let { email, password } = req.body;

    email = validateEmail(email);
    password = trimString(password);

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const query = `
        SELECT 
          u.user_id,
          u.email,
          u.fname,
          u.lname,
          uc.password,
          uc.is_locked,
          uc.attempts,
          uc.last_attempt,
          r.name AS role
        FROM users u
        JOIN user_credentials uc ON u.user_id = uc.user_id
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        WHERE u.email = $1
        LIMIT 1
        FOR UPDATE
      `;

      const { rows, rowCount } = await client.query(query, [email]);

      if (!rowCount) {
        throw new ApiError(401, "Invalid email or password");
      }

      const user = rows[0];
      const now = new Date();

      // 🔒 Lock handling
      if (user.is_locked && user.last_attempt) {
        const unlockTime =
          new Date(user.last_attempt).getTime() +
          LOCK_TIME_MINUTES * 60 * 1000;

        if (now.getTime() < unlockTime) {
          const remainingMinutes = Math.ceil(
            (unlockTime - now.getTime()) / (60 * 1000)
          );
          throw new ApiError(
            403,
            `Account locked. Try again in ${remainingMinutes} minutes`
          );
        }

        await client.query(
          `
          UPDATE user_credentials
          SET is_locked = false,
              attempts = 0
          WHERE user_id = $1
          `,
          [user.user_id]
        );
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        const newAttempts = user.attempts + 1;
        const shouldLock = newAttempts >= MAX_ATTEMPTS;

        await client.query(
          `
          UPDATE user_credentials
          SET attempts = $1,
              is_locked = $2,
              last_attempt = NOW()
          WHERE user_id = $3
          `,
          [newAttempts, shouldLock, user.user_id]
        );

        throw new ApiError(401, "Invalid email or password");
      }

      await client.query(
        `
        UPDATE user_credentials
        SET attempts = 0,
            is_locked = false,
            last_attempt = NOW()
        WHERE user_id = $1
        `,
        [user.user_id]
      );

      await client.query("COMMIT");

      // ✅ SINGLE ROLE
      const sessionUser = {
        user_id: user.user_id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        role: user.role, 
      };

      createSession(sessionUser, req);

      res.status(200).json({
        success: true,
        message: "Login successful",
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
);
