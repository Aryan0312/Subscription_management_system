// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const getQuotationById = asyncHandler(
  async (req: Request, res: Response) => {

    const templateId = Number(req.params.id);

    if (!templateId || Number.isNaN(templateId)) {
      throw new ApiError(400, "Invalid template_id");
    }

    const result = await pool.query(
      `
      SELECT
        qt.template_id,
        qt.name,
        qt.validity_days,
        qt.created_at,
        rp.plan_id,
        rp.name AS plan_name,
        rp.billing_period,
        u.email AS created_by_email,
        u.fname AS created_by_fname,
        u.lname AS created_by_lname
      FROM quotation_templates qt
      LEFT JOIN recurring_plans rp ON qt.plan_id = rp.plan_id
      JOIN users u ON qt.created_by = u.user_id
      WHERE qt.template_id = $1
      `,
      [templateId]
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Quotation template not found");
    }

    const template = result.rows[0];

    // Get lines
    const linesResult = await pool.query(
      `
      SELECT
        qtl.template_line_id,
        qtl.quantity,
        p.product_id,
        p.name AS product_name,
        p.sales_price,
        d.discount_id,
        d.name AS discount_name,
        d.type AS discount_type,
        d.value AS discount_value
      FROM quotation_template_lines qtl
      JOIN products p ON qtl.product_id = p.product_id
      LEFT JOIN discounts d ON qtl.discount_id = d.discount_id
      WHERE qtl.template_id = $1
      `,
      [templateId]
    );

    res.status(200).json({
      success: true,
      data: {
        template_id: template.template_id,
        name: template.name,
        validity_days: template.validity_days,
        created_at: template.created_at,
        plan: template.plan_id ? {
          plan_id: template.plan_id,
          name: template.plan_name,
          billing_period: template.billing_period
        } : null,
        lines: linesResult.rows.map(line => ({
          template_line_id: line.template_line_id,
          quantity: line.quantity,
          product: {
            product_id: line.product_id,
            name: line.product_name,
            sales_price: line.sales_price
          },
          discount: line.discount_id ? {
            discount_id: line.discount_id,
            name: line.discount_name,
            type: line.discount_type,
            value: line.discount_value
          } : null
        })),
        created_by: {
          email: template.created_by_email,
          fname: template.created_by_fname,
          lname: template.created_by_lname
        }
      }
    });
  }
);
