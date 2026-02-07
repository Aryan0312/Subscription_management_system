import { pool } from "../../config/db.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * CREATE PRODUCT
 * Roles: admin, super_admin    
 */
export const createProduct = async (
  data: {
    name: string;
    type: "SERVICE" | "PHYSICAL" | "DIGITAL";
    sales_price: number;
    cost_price?: number;
    is_recurring?: boolean;
    status?: "ACTIVE" | "INACTIVE";
  },
  createdBy: number
) => {
  const {
    name,
    type,
    sales_price,
    cost_price = 0,
    is_recurring = true,
    status = "ACTIVE",
  } = data;

  const { rows } = await pool.query(
    `
    INSERT INTO products
      (name, type, sales_price, cost_price, is_recurring, status, created_by)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [name, type, sales_price, cost_price, is_recurring, status, createdBy]
  );

  return rows[0];
};

/**
 * GET ALL PRODUCTS
 * Roles: any authenticated user
 */
export const getAllProducts = async (options?: {
  includeArchived?: boolean;
}) => {
  const includeArchived = options?.includeArchived ?? false;

  const query = includeArchived
    ? `SELECT * FROM products ORDER BY created_at DESC`
    : `
      SELECT * FROM products
      WHERE status != 'ARCHIVED'
      ORDER BY created_at DESC
    `;

  const { rows } = await pool.query(query);
  return rows;
};

/**
 * GET PRODUCT BY ID
 * Roles: any authenticated user
 */
export const getProductById = async (productId: number) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM products
    WHERE product_id = $1
    `,
    [productId]
  );

  if (!rows.length) {
    throw new ApiError(404, "Product not found");
  }

  return rows[0];
};

/**
 * UPDATE PRODUCT
 * Roles: admin, super_admin
 */
export const updateProduct = async (
  productId: number,
  data: Partial<{
    name: string;
    type: "SERVICE" | "PHYSICAL" | "DIGITAL";
    sales_price: number;
    cost_price: number;
    is_recurring: boolean;
    status: "ACTIVE" | "INACTIVE";
  }>
) => {
  const keys = Object.keys(data);

  if (!keys.length) {
    throw new ApiError(400, "No fields provided for update");
  }

  // Prevent updating forbidden fields
  if ("created_by" in data) {
    throw new ApiError(400, "Cannot update created_by");
  }

  const setClause = keys
    .map((key, idx) => `${key} = $${idx + 1}`)
    .join(", ");

  const values = Object.values(data);

  const { rows } = await pool.query(
    `
    UPDATE products
    SET ${setClause}
    WHERE product_id = $${keys.length + 1}
    RETURNING *
    `,
    [...values, productId]
  );

  if (!rows.length) {
    throw new ApiError(404, "Product not found");
  }

  return rows[0];
};

/**
 * SOFT DELETE PRODUCT (ARCHIVE)
 * Roles: super_admin
 */
export const archiveProduct = async (productId: number) => {
  const { rows } = await pool.query(
    `
    UPDATE products
    SET status = 'ARCHIVED'
    WHERE product_id = $1
    RETURNING *
    `,
    [productId]
  );

  if (!rows.length) {
    throw new ApiError(404, "Product not found");
  }

  return rows[0];
};
