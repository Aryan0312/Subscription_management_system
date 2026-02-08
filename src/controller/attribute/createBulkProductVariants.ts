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

          let attributeValueId;

          // 1️⃣ Check if attribute_value already exists
          const existingValue = await client.query(
            `
            SELECT attribute_value_id
            FROM attribute_values
            WHERE attribute_id = $1 AND value = $2 AND status = 'ACTIVE'
            `,
            [attributeId, valueText]
          );

          if ((existingValue.rowCount ?? 0) > 0) {
            // Use existing attribute_value_id
            attributeValueId = existingValue.rows[0].attribute_value_id;
          } else {
            // Create new attribute_value
            const valueResult = await client.query(
              `
              INSERT INTO attribute_values
              (attribute_id, value, extra_price, status)
              VALUES ($1,$2,$3,'ACTIVE')
              RETURNING attribute_value_id
              `,
              [attributeId, valueText, extraPrice]
            );
            attributeValueId = valueResult.rows[0].attribute_value_id;
          }

          // 2️⃣ Check if already linked to product
          const existingLink = await client.query(
            `
            SELECT 1
            FROM product_attribute_values
            WHERE product_id = $1 AND attribute_value_id = $2
            `,
            [productId, attributeValueId]
          );

          if ((existingLink.rowCount ?? 0) === 0) {
            // Link to product
            await client.query(
              `
              INSERT INTO product_attribute_values
              (product_id, attribute_value_id)
              VALUES ($1,$2)
              `,
              [productId, attributeValueId]
            );
          }

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
