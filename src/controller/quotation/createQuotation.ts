// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { getCreatedBy } from "../../utils/getCreatedBy.js";
import { trimString } from "../../utils/sanitize.js";
import { Request, Response } from "express";

export const createQuotation = asyncHandler(
  async (req: Request, res: Response) => {

    const { name, validity_days, plan_id, lines } = req.body;

    if (!name || !Array.isArray(lines) || lines.length === 0) {
      throw new ApiError(400, "name and lines are required");
    }

    const createdBy = getCreatedBy(req);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Create template
      const templateResult = await client.query(
        `
        INSERT INTO quotation_templates
        (name, validity_days, plan_id, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [trimString(name), validity_days ?? 30, plan_id ?? null, createdBy]
      );

      const templateId = templateResult.rows[0].template_id;

      // Add lines
      const createdLines = [];
      for (const line of lines) {
        if (!line.product_id || !line.quantity) {
          throw new ApiError(400, "Each line must have product_id and quantity");
        }

        const lineResult = await client.query(
          `
          INSERT INTO quotation_template_lines
          (template_id, product_id, quantity, discount_id)
          VALUES ($1, $2, $3, $4)
          RETURNING *
          `,
          [templateId, line.product_id, line.quantity, line.discount_id ?? null]
        );

        createdLines.push(lineResult.rows[0]);
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Quotation template created successfully",
        data: {
          template: templateResult.rows[0],
          lines: createdLines
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
