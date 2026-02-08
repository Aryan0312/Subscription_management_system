// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF.js";
import { Request, Response } from "express";

export const downloadInvoicePDF = asyncHandler(
  async (req: Request, res: Response) => {

    const invoiceId = Number(req.params.id);

    if (!invoiceId || Number.isNaN(invoiceId)) {
      throw new ApiError(400, "Invalid invoice_id");
    }

    // Get invoice with customer details
    const invoiceResult = await pool.query(
      `
      SELECT
        i.*,
        c.company_name,
        c.billing_address,
        u.email AS customer_email,
        u.fname AS customer_fname,
        u.lname AS customer_lname,
        u.phone AS customer_phone
      FROM invoices i
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

    // Prepare data for PDF
    const invoiceData = {
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      discount_amount: invoice.discount_amount,
      total_amount: invoice.total_amount,
      amount_paid: invoice.amount_paid,
      customer: {
        company_name: invoice.company_name,
        billing_address: invoice.billing_address,
        email: invoice.customer_email,
        fname: invoice.customer_fname,
        lname: invoice.customer_lname,
        phone: invoice.customer_phone
      },
      lines: linesResult.rows.map(line => ({
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate,
        line_total: line.line_total
      }))
    };

    // Generate and stream PDF
    generateInvoicePDF(invoiceData, res);
  }
);
