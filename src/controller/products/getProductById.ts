// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";


export const getProductById = asyncHandler(async (req:Request, res:Response) => {
  const rawId =
    typeof req.params.id === "string" ? trimString(req.params.id) : undefined;

  const productId = rawId ? Number(rawId) : NaN;

  if (!productId || Number.isNaN(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const result = await pool.query(
    `
    SELECT *
    FROM products
    WHERE product_id = $1
    `,
    [productId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, "Product not found");
  }

  const product = result.rows[0];

  if (req.session.user?.role === "user" && product.status !== "ACTIVE") {
    throw new ApiError(403, "You are not allowed to access this product");
  }

  res.status(200).json({
    success: true,
    data: product
  });
});
