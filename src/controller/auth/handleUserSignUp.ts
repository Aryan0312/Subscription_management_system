import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import {
  trimString,
  validateEmail,
  validateIndianPhone,
  validatePassword
} from "../../utils/sanitize.js";

const SALT_ROUNDS = 12;

export const handleUserSignup = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.body) {
      throw new ApiError(400, "Send valid fields!");
    }

    let { email, password, fname, lname, phone } = req.body;

    //  Sanitize + validate
    email = validateEmail(email);
    fname = trimString(fname);
    lname = trimString(lname);
    phone = validateIndianPhone(phone);
    password = validatePassword(password);


    //  Required fields check
    if (!email || !password || !fname || !lname || !phone) {
      throw new ApiError(400, "All fields are required");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Check email uniqueness
      const emailCheck = await client.query(
        `SELECT 1 FROM users WHERE email = $1`,
        [email]
      );

      if (emailCheck.rowCount) {
        throw new ApiError(409, "Email already registered");
      }

      // Check email uniqueness
      const phoneCheck = await client.query(
        `SELECT 1 FROM users WHERE phone = $1`,
        [phone]
      );

      if (phoneCheck.rowCount) {
        throw new ApiError(409, "This phone number is already registered!");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const userResult = await client.query(
        `
        INSERT INTO users (email, fname, lname, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
        `,
        [email, fname, lname, phone]
      );

      const userId = userResult.rows[0].user_id;

      // Create credentials
      await client.query(
        `
        INSERT INTO user_credentials (user_id, password)
        VALUES ($1, $2)
        `,
        [userId, hashedPassword]
      );

      // FORCE USER ROLE 
      await client.query(
        `
        INSERT INTO user_roles (user_id, role_id)
          SELECT $1, role_id FROM roles WHERE name = 'user'
          `,
          [userId]
        );

        await client.query("COMMIT");

        res.status(201).json({
        success: true,
        message: "Signup successful. Please login.",
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
);
