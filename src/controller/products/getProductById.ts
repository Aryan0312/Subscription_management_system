// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {

    // 1️⃣ Validate product_id
    const rawId =
      typeof req.params.id === "string"
        ? trimString(req.params.id)
        : undefined;

    const productId = rawId ? Number(rawId) : NaN;

    if (!productId || Number.isNaN(productId)) {
      throw new ApiError(400, "Invalid product ID");
    }

    // 2️⃣ Fetch product
    const productResult = await pool.query(
      `
      SELECT
        product_id,
        name,
        type,
        sales_price,
        is_recurring,
        status
      FROM products
      WHERE product_id = $1
      `,
      [productId]
    );

    if (productResult.rowCount === 0) {
      throw new ApiError(404, "Product not found");
    }

    const product = productResult.rows[0];

    // 3️⃣ Access control
    if (req.session.user?.role === "user" && product.status !== "ACTIVE") {
      throw new ApiError(403, "You are not allowed to access this product");
    }

    // 4️⃣ Fetch plan + pricing details (EXACT FIELDS)
    const pricingResult = await pool.query(
      `
      SELECT
        rp.plan_id,
        rp.name AS plan_name,
        rp.billing_period,

        ppp.min_quantity,
        ppp.price,
        ppp.start_date,
        ppp.end_date
      FROM product_plan_prices ppp
      JOIN recurring_plans rp
        ON rp.plan_id = ppp.plan_id
      WHERE ppp.product_id = $1
      ORDER BY rp.plan_id, ppp.min_quantity ASC
      `,
      [productId]
    );

// 5️⃣ Fetch variants/attributes linked to product
    const variantsResult = await pool.query(
      `
      SELECT
        a.attribute_id,
        a.name AS attribute_name,
        av.attribute_value_id,
        av.value,
        av.extra_price
      FROM product_attribute_values pav
      JOIN attribute_values av
        ON av.attribute_value_id = pav.attribute_value_id
        AND av.status = 'ACTIVE'
      JOIN attributes a
        ON a.attribute_id = av.attribute_id
        AND a.status = 'ACTIVE'
      WHERE pav.product_id = $1
      ORDER BY a.name ASC, av.value ASC
      `,
      [productId]
    );

    // Group variants by attribute
    const variantMap = new Map<number, any>();
    
    for (const row of variantsResult.rows) {
      if (!variantMap.has(row.attribute_id)) {
        variantMap.set(row.attribute_id, {
          attribute_id: row.attribute_id,
          attribute_name: row.attribute_name,
          values: []
        });
      }
      
      variantMap.get(row.attribute_id).values.push({
        attribute_value_id: row.attribute_value_id,
        value: row.value,
        extra_price: Number(row.extra_price)
      });
    }
    
    const variants = Array.from(variantMap.values());

    // 6️⃣ Response
    res.status(200).json({
      success: true,
      data: {
        product: {
          product_id: product.product_id,
          name: product.name,
          type: product.type,
          sales_price: product.sales_price,
          is_recurring: product.is_recurring
        },
        plans: pricingResult.rows,
        variants: variants
      }
    });
  }
);
