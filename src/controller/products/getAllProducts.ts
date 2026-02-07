// @ts-check

import { Request, Response } from "express";
import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { trimString } from "../../utils/sanitize.js";

export const getAllProducts = asyncHandler(async (req:Request, res:Response) => {
  const page =
    typeof req.query.page === "string"
      ? Math.max(parseInt(req.query.page) || 1, 1)
      : 1;

  const limit =
    typeof req.query.limit === "string"
      ? Math.min(parseInt(req.query.limit) || 50, 100)
      : 50;

  const offset = (page - 1) * limit;

  const status =
    typeof req.query.status === "string"
      ? trimString(req.query.status)
      : undefined;

  const type =
    typeof req.query.type === "string"
      ? trimString(req.query.type)
      : undefined;

  const is_recurring =
    typeof req.query.is_recurring === "string"
      ? req.query.is_recurring === "true"
      : undefined;

  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (is_recurring !== undefined) {
    values.push(is_recurring);
    conditions.push(`is_recurring = $${values.length}`);
  }

  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataQuery = `
    SELECT *
    FROM products
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM products
    ${whereClause}
  `;

  const [productsResult, countResult] = await Promise.all([
    pool.query(dataQuery, [...values, limit, offset]),
    pool.query(countQuery, values)
  ]);

  res.status(200).json({
    success: true,
    data: productsResult.rows,
    pagination: {
      page,
      limit,
      total_records: countResult.rows[0].total,
      total_pages: Math.ceil(countResult.rows[0].total / limit)
    }
  });
});
