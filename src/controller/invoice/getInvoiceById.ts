// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { Request, Response } from "express";

export const getInvoiceById = asyncHandler(
  async (req: Request, res: Response) => {

    const invoiceId = Number(req.params.id);

    if (!invoiceId || Number.isNaN(invoiceId)) {
      throw new ApiError(400, "Invalid invoice_id");
    }

    // Get invoice with customer and subscription details
    const invoiceResult = await pool.query(
      `
      SELECT
        i.*,
        s.subscription_number,
        c.company_name,
        c.billing_address,
        c.shipping_address,
        c.tax_id AS customer_tax_id,
        u.email AS customer_email,
        u.fname AS customer_fname,
        u.lname AS customer_lname,
        u.phone AS customer_phone
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.subscription_id
      JOIN contacts c ON i.customer_id = c.contact_id
      JOIN users u ON c.user_id = u.user_id
      WHERE i.invoice_id = $1
      `,
      [invoiceId]
    );

    if ((invoiceResult.rowCount ?? 0) === 0) {
      throw new ApiError(404, "Invoice not found");
    }

    const invoice = invoiceResult.rows[0];

    // Get invoice lines
    const linesResult = await pool.query(
      `
      SELECT *
      FROM invoice_lines
      WHERE invoice_id = $1
      ORDER BY invoice_line_id
      `,
      [invoiceId]
    );

    res.status(200).json({
      success: true,
      data: {
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        discount_amount: invoice.discount_amount,
        total_amount: invoice.total_amount,
        amount_paid: invoice.amount_paid,
        sent_at: invoice.sent_at,
        created_at: invoice.created_at,
        subscription: {
          subscription_id: invoice.subscription_id,
          subscription_number: invoice.subscription_number
        },
        customer: {
          contact_id: invoice.customer_id,
          company_name: invoice.company_name,
          billing_address: invoice.billing_address,
          shipping_address: invoice.shipping_address,
          tax_id: invoice.customer_tax_id,
          email: invoice.customer_email,
          fname: invoice.customer_fname,
          lname: invoice.customer_lname,
          phone: invoice.customer_phone
        },
        lines: linesResult.rows.map(line => ({
          invoice_line_id: line.invoice_line_id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          tax_rate: line.tax_rate,
          line_total: line.line_total
        }))
      }
    });
  }
);
