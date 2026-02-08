// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const createBulkProductVariants = asyncHandler(
  async (req: Request, res: Response) => {

    const { product_id, attributes } = req.body;

    // BODY RULE
    if (
      !product_id ||
      !Array.isArray(attributes) ||
      attributes.length === 0
    ) {
      throw new ApiError(400, "Invalid request body");
    }

    const productId = Number(product_id);
    if (Number.isNaN(productId)) {
      throw new ApiError(400, "Invalid product_id");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Check product
      const product = await client.query(
        `SELECT 1 FROM products WHERE product_id = $1`,
        [productId]
      );
      if ((product.rowCount ?? 0) === 0) {
        throw new ApiError(404, "Product not found");
      }

      const createdVariants: any[] = [];

      for (const attr of attributes) {
        const { attribute_id, values } = attr;

        if (
          !attribute_id ||
          !Array.isArray(values) ||
          values.length === 0
        ) {
          throw new ApiError(400, "Invalid attribute block");
        }

        const attributeId = Number(attribute_id);

        for (const val of values) {
          if (!val.value || val.extra_price === undefined) {
            throw new ApiError(400, "Invalid attribute value");
          }

          const valueText = trimString(val.value);
          const extraPrice = Number(val.extra_price);

          // 1️⃣ Create attribute_value
          const valueResult = await client.query(
            `
            INSERT INTO attribute_values
            (attribute_id, value, extra_price, status)
            VALUES ($1,$2,$3,'ACTIVE')
            RETURNING attribute_value_id
            `,
            [attributeId, valueText, extraPrice]
          );

          const attributeValueId =
            valueResult.rows[0].attribute_value_id;

          // 2️⃣ Map to product
          await client.query(
            `
            INSERT INTO product_attribute_values
            (product_id, attribute_value_id)
            VALUES ($1,$2)
            `,
            [productId, attributeValueId]
          );

          createdVariants.push({
            attribute_id: attributeId,
            attribute_value_id: attributeValueId,
            value: valueText,
            extra_price: extraPrice
          });
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Product variants created successfully",
        data: createdVariants
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
);
