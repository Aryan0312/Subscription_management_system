// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";

/**
 * Get all attributes with their values
 */
export const getAllAttributesWithValues = asyncHandler(
  async (req: Request, res: Response) => {

    const result = await pool.query(
      `
      SELECT
        a.attribute_id,
        a.name,
        a.created_at,
        a.updated_at,

        av.attribute_value_id,
        av.value,
        av.extra_price
      FROM attributes a
      LEFT JOIN attribute_values av
        ON av.attribute_id = a.attribute_id
        AND av.status = 'ACTIVE'
      WHERE a.status = 'ACTIVE'
      ORDER BY a.name ASC, av.value ASC
      `
    );

    // Group into frontend-friendly structure
    const attributeMap = new Map<number, any>();

    for (const row of result.rows) {
      if (!attributeMap.has(row.attribute_id)) {
        attributeMap.set(row.attribute_id, {
          attribute_id: row.attribute_id,
          name: row.name,
          created_at: row.created_at,
          updated_at: row.updated_at,
          values: []
        });
      }

      if (row.attribute_value_id) {
        attributeMap.get(row.attribute_id).values.push({
          value_id: row.attribute_value_id,
          value: row.value,
          extra_price: Number(row.extra_price)
        });
      }
    }

    const data = Array.from(attributeMap.values());

    res.status(200).json({
      data,
      total: data.length
    });
  }
);
