import { Request, Response } from "express";
import { getCreatedBy } from "../../utils/getCreatedBy.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { pool } from "../../config/db.js";

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {

    if(!req.body || !req.body.name || !req.body.type || !req.body.sales_price){
      throw new ApiError(400, "Missing required fields");
    }

    const {
      name,
      type,
      sales_price,
      cost_price = 0,
      is_recurring,
      status = "ACTIVE"
    } = req.body;

    const userId = getCreatedBy(req); 

    // 1️⃣ Basic validation
    if (!name || !type || sales_price === undefined || is_recurring === undefined) {
      throw new ApiError(400, "Missing required fields");
    }

    // 2️⃣ Enum validation
    const validTypes = ["SERVICE", "PHYSICAL", "DIGITAL"];
    const validStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"];

    if (!validTypes.includes(type)) {
      throw new ApiError(400, "Invalid product type");
    }

    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid product status");
    }


    if (sales_price < 0 || cost_price < 0) {
      throw new ApiError(400, "Prices cannot be negative");
    }

    // 4️⃣ Insert into DB
    const result = await pool.query(
      `
      INSERT INTO products
        (name, type, sales_price, cost_price, is_recurring, status, created_by)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        name.trim(),
        type,
        sales_price,
        cost_price,
        is_recurring,
        status,
        userId
      ]
    );

    // 5️⃣ Success response
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: result.rows[0]
    });
  }
);
