// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const updateAttributeWithValues = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.params.id || !req.body.name || !Array.isArray(req.body.values)) {
      throw new ApiError(400, "attribute_id, name and values are required");
    }

    const attributeId = Number(req.params.id);
    const name = trimString(req.body.name);
    const values = req.body.values;

    if (!attributeId || Number.isNaN(attributeId)) {
      throw new ApiError(400, "Invalid attribute_id");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1️⃣ Update attribute
      const attrResult = await client.query(
        `
        UPDATE attributes
        SET name = $1, updated_at = NOW()
        WHERE attribute_id = $2 AND status = 'ACTIVE'
        RETURNING attribute_id, name, created_at, updated_at
        `,
        [name, attributeId]
      );

      if (attrResult.rowCount === 0) {
        throw new ApiError(404, "Attribute not found");
      }

      // 2️⃣ Existing values
      const existingValuesResult = await client.query(
        `
        SELECT attribute_value_id
        FROM attribute_values
        WHERE attribute_id = $1 AND status = 'ACTIVE'
        `,
        [attributeId]
      );

      const existingIds = existingValuesResult.rows.map(
        r => r.attribute_value_id
      );

      const incomingIds = values
        .filter((v: any) => v.value_id)
        .map((v: any) => v.value_id);

      // 3️⃣ Archive removed values
      const toArchive = existingIds.filter(
        id => !incomingIds.includes(id)
      );

      if (toArchive.length > 0) {
        await client.query(
          `
          UPDATE attribute_values
          SET status = 'ARCHIVED', updated_at = NOW()
          WHERE attribute_value_id = ANY($1)
          `,
          [toArchive]
        );
      }

      const finalValues = [];

      // 4️⃣ Update / Insert values
      for (const v of values as any[]) {
        const value = trimString(v.value);
        const extra_price = Number(v.extra_price);

        if (v.value_id) {
          const updateResult = await client.query(
            `
            UPDATE attribute_values
            SET value = $1, extra_price = $2, updated_at = NOW()
            WHERE attribute_value_id = $3
            RETURNING attribute_value_id, value, extra_price
            `,
            [value, extra_price, v.value_id]
          );

          finalValues.push({
            value_id: updateResult.rows[0].attribute_value_id,
            value: updateResult.rows[0].value,
            extra_price: Number(updateResult.rows[0].extra_price)
          });
        } else {
          const insertResult = await client.query(
            `
            INSERT INTO attribute_values
            (attribute_id, value, extra_price)
            VALUES ($1,$2,$3)
            RETURNING attribute_value_id, value, extra_price
            `,
            [attributeId, value, extra_price]
          );

          finalValues.push({
            value_id: insertResult.rows[0].attribute_value_id,
            value: insertResult.rows[0].value,
            extra_price: Number(insertResult.rows[0].extra_price)
          });
        }
      }

      await client.query("COMMIT");

      res.status(200).json({
        data: {
          attribute_id: attrResult.rows[0].attribute_id,
          name: attrResult.rows[0].name,
          values: finalValues,
          created_at: attrResult.rows[0].created_at,
          updated_at: attrResult.rows[0].updated_at
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
