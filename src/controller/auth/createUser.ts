import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import {
  trimString,
  validateEmail,
  validateIndianPhone,
  validatePassword,
} from "../../utils/sanitize.js";
import { getSession } from "../../service/authService.js";
import { generateRandomPassword } from "../../utils/generateRandomPassword.js";
import { sendMailAsync } from "../../utils/sendMailAsync.js";

const SALT_ROUNDS = 12;

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  
    if (!req.body) {
        throw new ApiError(400, "Send valid fields!");
    }

  let { email, fname, lname, phone, role } = req.body;

  //  Sanitize + validate
  email = validateEmail(email);
  fname = trimString(fname);
  lname = trimString(lname);
  phone = validateIndianPhone(phone);
  role = trimString(role.toLowerCase());

  //  Required fields check
  if (!email || !fname || !lname || !phone ||!role) {
    throw new ApiError(400, "All fields are required");
  }

  const client = await pool.connect();

  try {
    const sessionUser = getSession(req);

    if (!sessionUser || !sessionUser.role) {
      throw new ApiError(403, "Unauthorized");
    }

    // default role if not sent
    role = role || "user";

    // ADMIN RULE
    if (sessionUser.role === "admin") {
      if (role !== "user") {
        throw new ApiError(403, "Admin can only create users with role 'user'");
      }
    }

    // SUPER ADMIN RULE
    if (sessionUser.role === "super_admin") {
      if (!["user", "admin", "super_admin"].includes(role)) {
        throw new ApiError(403, "Invalid role");
      }
    }

    // BLOCK EVERYONE ELSE
    if (sessionUser.role !== "admin" && sessionUser.role !== "super_admin") {
      throw new ApiError(403, "You are not allowed to create users");
    }

    await client.query("BEGIN");

    // Check email uniqueness
    const emailCheck = await client.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [email],
    );

    if (emailCheck.rowCount ?? 0) {
      throw new ApiError(409, "Email already registered");
    }

    // Check phone uniqueness
    const phoneCheck = await client.query(
      `SELECT 1 FROM users WHERE phone = $1`,
      [phone],
    );

    if (phoneCheck.rowCount ?? 0) {
      throw new ApiError(409, "This phone number is already registered!");
    }

    const password = generateRandomPassword();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userResult = await client.query(
      `
        INSERT INTO users (email, fname, lname, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
        `,
      [email, fname, lname, phone],
    );

    const userId = userResult.rows[0].user_id;

    // Create credentials
    await client.query(
      `
        INSERT INTO user_credentials (user_id, password)
        VALUES ($1, $2)
        `,
      [userId, hashedPassword],
    );

    // INSERT IN user_role
    await client.query(
      `
        INSERT INTO user_roles (user_id, role_id)
            SELECT $1, role_id FROM roles WHERE name = $2
            `,
      [userId, role],
    );

    await client.query("COMMIT");

    const emailMessage = `
        <h2>Welcome to Recuro</h2>
        <p>Your account has been successfully created.</p>

        <p><strong>Login Details:</strong></p>
        <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Temporary Password:</strong> ${password}</li>
        </ul>

        <p>
            For security reasons, please <strong>change your password immediately after logging in</strong>.
        </p>

        <p>Best regards,<br/><strong>Recuro Team</strong></p>
        `;

    sendMailAsync(email, "Your Account Credentials - Recuro", emailMessage);

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
});
