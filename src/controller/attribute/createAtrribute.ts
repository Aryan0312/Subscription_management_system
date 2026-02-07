// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const createAttributeWithValues = asyncHandler(
  async (req: Request, res: Response) => {

    // 1️⃣ Body rule
    if (!req.body.name || !Array.isArray(req.body.values)) {
      throw new ApiError(400, "name and values are required");
    }

    const name = trimString(req.body.name);
    const values = req.body.values;

    if (values.length === 0) {
      throw new ApiError(400, "values cannot be empty");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 2️⃣ Create attribute
      const attributeResult = await client.query(
        `
        INSERT INTO attributes (name)
        VALUES ($1)
        RETURNING attribute_id, name, created_at, updated_at
        `,
        [name]
      );

      const attribute = attributeResult.rows[0];

      // 3️⃣ Insert values
      const insertedValues = [];

      for (const v of values) {
        if (!v.value && v.extra_price === undefined) {
          throw new ApiError(400, "Each value must have value and extra_price");
        }

        const value = trimString(v.value);
        const extra_price = Number(v.extra_price);

        const valueResult = await client.query(
          `
          INSERT INTO attribute_values
          (attribute_id, value, extra_price)
          VALUES ($1,$2,$3)
          RETURNING attribute_value_id, value, extra_price
          `,
          [attribute.attribute_id, value, extra_price]
        );

        insertedValues.push({
          value_id: valueResult.rows[0].attribute_value_id,
          value: valueResult.rows[0].value,
          extra_price: Number(valueResult.rows[0].extra_price)
        });
      }

      await client.query("COMMIT");

      res.status(201).json({
        data: {
          attribute_id: attribute.attribute_id,
          name: attribute.name,
          values: insertedValues,
          created_at: attribute.created_at,
          updated_at: attribute.updated_at
        }
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
);
