// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { getSession } from "../../service/authService.js";
import { trimString, validateEmail, validateIndianPhone } from "../../utils/sanitize.js";
import { generateRandomPassword } from "../../utils/generateRandomPassword.js";
import { sendMailAsync } from "../../utils/sendMailAsync.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const createContact = asyncHandler(
  async (req: Request, res: Response) => {

    const {
      email,
      fname,
      lname,
      phone,
      role,
      company_name,
      billing_address,
      shipping_address,
      tax_id,
      is_customer
    } = req.body;

    // BODY RULE
    if (
      !email ||
      !fname ||
      !lname ||
      !phone ||
      !role ||
      !company_name ||
      typeof is_customer !== "boolean"
    ) {
      throw new ApiError(400, "All required fields must be provided");
    }

    // Sanitize + validate
    const validatedEmail = validateEmail(email);
    const validatedFname = trimString(fname);
    const validatedLname = trimString(lname);
    const validatedPhone = validateIndianPhone(phone);
    const validatedRole = trimString(role.toLowerCase());
    const validatedCompanyName = trimString(company_name);

    const client = await pool.connect();

    try {
      const sessionUser = getSession(req);

      if (!sessionUser || !sessionUser.role) {
        throw new ApiError(403, "Unauthorized");
      }

      // ADMIN RULE
      if (sessionUser.role === "admin") {
        if (validatedRole !== "user") {
          throw new ApiError(403, "Admin can only create users with role 'user'");
        }
      }

      // SUPER ADMIN RULE
      if (sessionUser.role === "super_admin") {
        if (!["user", "admin", "super_admin"].includes(validatedRole)) {
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
        [validatedEmail]
      );

      if (emailCheck.rowCount ?? 0) {
        throw new ApiError(409, "Email already registered");
      }

      // Check phone uniqueness
      const phoneCheck = await client.query(
        `SELECT 1 FROM users WHERE phone = $1`,
        [validatedPhone]
      );

      if (phoneCheck.rowCount ?? 0) {
        throw new ApiError(409, "This phone number is already registered!");
      }

      const password = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // 1️⃣ Create user
      const userResult = await client.query(
        `
        INSERT INTO users (email, fname, lname, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
        `,
        [validatedEmail, validatedFname, validatedLname, validatedPhone]
      );

      const userId = userResult.rows[0].user_id;

      // 2️⃣ Create credentials
      await client.query(
        `
        INSERT INTO user_credentials (user_id, password)
        VALUES ($1, $2)
        `,
        [userId, hashedPassword]
      );

      // 3️⃣ Assign role
      await client.query(
        `
        INSERT INTO user_roles (user_id, role_id)
        SELECT $1, role_id FROM roles WHERE name = $2
        `,
        [userId, validatedRole]
      );

      // 4️⃣ Create contact
      const contactResult = await client.query(
        `
        INSERT INTO contacts
        (
          user_id,
          company_name,
          billing_address,
          shipping_address,
          tax_id,
          is_customer
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
        `,
        [
          userId,
          validatedCompanyName,
          billing_address ?? null,
          shipping_address ?? null,
          tax_id ?? null,
          is_customer
        ]
      );

      await client.query("COMMIT");

      // Send email
      const emailMessage = `
        <h2>Welcome to Recuro</h2>
        <p>Your account has been successfully created.</p>

        <p><strong>Login Details:</strong></p>
        <ul>
            <li><strong>Email:</strong> ${validatedEmail}</li>
            <li><strong>Temporary Password:</strong> ${password}</li>
        </ul>

        <p>
            For security reasons, please <strong>change your password immediately after logging in</strong>.
        </p>

        <p>Best regards,<br/><strong>Recuro Team</strong></p>
      `;

      sendMailAsync(validatedEmail, "Your Account Credentials - Recuro", emailMessage);

      res.status(201).json({
        success: true,
        message: "User and contact created successfully",
        data: {
          user_id: userId,
          contact: contactResult.rows[0]
        }
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
);
