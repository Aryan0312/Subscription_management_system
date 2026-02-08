// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { getCreatedBy } from "../../utils/getCreatedBy.js";
import { Request, Response } from "express";

export const generateInvoiceFromSubscription = asyncHandler(
  async (req: Request, res: Response) => {

    const subscriptionId = Number(req.params.id);
    const { issue_date, due_date, period_start, period_end } = req.body;

    if (!subscriptionId || !issue_date || !due_date) {
      throw new ApiError(400, "subscription_id, issue_date, and due_date are required");
    }

    const createdBy = getCreatedBy(req);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get subscription details
      const subResult = await client.query(
        `
        SELECT s.*, c.contact_id
        FROM subscriptions s
        JOIN contacts c ON s.customer_id = c.contact_id
        WHERE s.subscription_id = $1
        `,
        [subscriptionId]
      );

      if ((subResult.rowCount ?? 0) === 0) {
        throw new ApiError(404, "Subscription not found");
      }

      const subscription = subResult.rows[0];

      // Get subscription lines with product details
      const linesResult = await client.query(
        `
        SELECT
          sl.*,
          p.name AS product_name,
          p.type AS product_type,
          t.value AS tax_rate,
          t.calculation_type AS tax_type,
          d.value AS discount_value,
          d.type AS discount_type
        FROM subscription_lines sl
        JOIN products p ON sl.product_id = p.product_id
        LEFT JOIN taxes t ON sl.tax_id = t.tax_id
        LEFT JOIN discounts d ON sl.discount_id = d.discount_id
        WHERE sl.subscription_id = $1
        `,
        [subscriptionId]
      );

      if (linesResult.rows.length === 0) {
        throw new ApiError(400, "Subscription has no lines to invoice");
      }

      // Calculate totals
      let subtotal = 0;
      let tax_amount = 0;
      let discount_amount = 0;

      const invoiceLines = linesResult.rows.map(line => {
        const lineSubtotal = Number(line.unit_price) * line.quantity;
        
        // Calculate discount
        let lineDiscount = 0;
        if (line.discount_id) {
          if (line.discount_type === 'PERCENTAGE') {
            lineDiscount = lineSubtotal * (Number(line.discount_value) / 100);
          } else {
            lineDiscount = Number(line.discount_value);
          }
        }

        const afterDiscount = lineSubtotal - lineDiscount;

        // Calculate tax
        let lineTax = 0;
        if (line.tax_id) {
          if (line.tax_type === 'PERCENTAGE') {
            lineTax = afterDiscount * (Number(line.tax_rate) / 100);
          } else {
            lineTax = Number(line.tax_rate);
          }
        }

        const lineTotal = afterDiscount + lineTax;

        subtotal += lineSubtotal;
        discount_amount += lineDiscount;
        tax_amount += lineTax;

        return {
          description: line.product_name,
          quantity: line.quantity,
          unit_price: line.unit_price,
          tax_rate: line.tax_rate ?? 0,
          line_total: lineTotal
        };
      });

      const total_amount = subtotal - discount_amount + tax_amount;

      // Create invoice
      const invoiceResult = await client.query(
        `
        INSERT INTO invoices
        (
          subscription_id,
          customer_id,
          issue_date,
          due_date,
          period_start,
          period_end,
          subtotal,
          tax_amount,
          discount_amount,
          total_amount,
          status,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'DRAFT', $11)
        RETURNING *
        `,
        [
          subscriptionId,
          subscription.contact_id,
          issue_date,
          due_date,
          period_start ?? null,
          period_end ?? null,
          subtotal,
          tax_amount,
          discount_amount,
          total_amount,
          createdBy
        ]
      );

      const invoiceId = invoiceResult.rows[0].invoice_id;

      // Create invoice lines
      for (const line of invoiceLines) {
        await client.query(
          `
          INSERT INTO invoice_lines
          (invoice_id, description, quantity, unit_price, tax_rate, line_total)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            invoiceId,
            line.description,
            line.quantity,
            line.unit_price,
            line.tax_rate,
            line.line_total
          ]
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Invoice generated successfully",
        data: invoiceResult.rows[0]
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
);
