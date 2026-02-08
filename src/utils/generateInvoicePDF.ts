// @ts-check

import PDFDocument from "pdfkit";
import { Response } from "express";

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  amount_paid: string;
  customer: {
    company_name: string;
    billing_address: any;
    email: string;
    fname: string;
    lname: string;
    phone: string;
  };
  lines: Array<{
    description: string;
    quantity: number;
    unit_price: string;
    tax_rate: string;
    line_total: string;
  }>;
}

export const generateInvoicePDF = (invoiceData: InvoiceData, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${invoiceData.invoice_number}.pdf`
  );

  // Pipe PDF to response
  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .text("INVOICE", 50, 50, { align: "right" })
    .fontSize(10)
    .text(`Invoice #: ${invoiceData.invoice_number}`, { align: "right" })
    .text(`Date: ${invoiceData.issue_date}`, { align: "right" })
    .text(`Due Date: ${invoiceData.due_date}`, { align: "right" })
    .text(`Status: ${invoiceData.status}`, { align: "right" })
    .moveDown();

  // Company Info (Left)
  doc
    .fontSize(12)
    .text("Recuro", 50, 50)
    .fontSize(10)
    .text("Subscription Management System", 50, 65)
    .text("Built for Odoo × SNS Hackathon '26", 50, 80)
    .moveDown();

  // Bill To (Left)
  doc
    .fontSize(12)
    .text("Bill To:", 50, 150)
    .fontSize(10)
    .text(invoiceData.customer.company_name, 50, 170)
    .text(
      `${invoiceData.customer.fname} ${invoiceData.customer.lname}`,
      50,
      185
    )
    .text(invoiceData.customer.email, 50, 200)
    .text(invoiceData.customer.phone, 50, 215);

  if (invoiceData.customer.billing_address) {
    const addr = invoiceData.customer.billing_address;
    doc.text(
      `${addr.street || ""}, ${addr.city || ""}, ${addr.zip || ""}`,
      50,
      230
    );
  }

  // Line Items Table
  const tableTop = 280;
  const itemCodeX = 50;
  const descriptionX = 150;
  const quantityX = 300;
  const priceX = 370;
  const amountX = 450;

  // Table Header
  doc
    .fontSize(10)
    .text("Description", descriptionX, tableTop, { bold: true })
    .text("Qty", quantityX, tableTop)
    .text("Price", priceX, tableTop)
    .text("Amount", amountX, tableTop);

  // Draw line under header
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Table Rows
  let yPosition = tableTop + 25;
  invoiceData.lines.forEach((line) => {
    doc
      .fontSize(9)
      .text(line.description, descriptionX, yPosition, { width: 140 })
      .text(line.quantity.toString(), quantityX, yPosition)
      .text(`$${line.unit_price}`, priceX, yPosition)
      .text(`$${line.line_total}`, amountX, yPosition);

    yPosition += 20;
  });

  // Draw line before totals
  yPosition += 10;
  doc
    .moveTo(50, yPosition)
    .lineTo(550, yPosition)
    .stroke();

  // Totals
  yPosition += 15;
  const totalsX = 400;

  doc
    .fontSize(10)
    .text("Subtotal:", totalsX, yPosition)
    .text(`$${invoiceData.subtotal}`, amountX, yPosition);

  yPosition += 20;
  doc
    .text("Discount:", totalsX, yPosition)
    .text(`-$${invoiceData.discount_amount}`, amountX, yPosition);

  yPosition += 20;
  doc
    .text("Tax:", totalsX, yPosition)
    .text(`$${invoiceData.tax_amount}`, amountX, yPosition);

  yPosition += 20;
  doc
    .fontSize(12)
    .text("Total:", totalsX, yPosition, { bold: true })
    .text(`$${invoiceData.total_amount}`, amountX, yPosition);

  yPosition += 25;
  doc
    .fontSize(10)
    .text("Amount Paid:", totalsX, yPosition)
    .text(`$${invoiceData.amount_paid}`, amountX, yPosition);

  yPosition += 20;
  const balance = (
    parseFloat(invoiceData.total_amount) - parseFloat(invoiceData.amount_paid)
  ).toFixed(2);
  doc
    .fontSize(12)
    .text("Balance Due:", totalsX, yPosition, { bold: true })
    .text(`$${balance}`, amountX, yPosition);

  // Footer
  doc
    .fontSize(8)
    .text(
      "Thank you for your business!",
      50,
      doc.page.height - 100,
      { align: "center" }
    )
    .text(
      "For questions, contact support@recuro.com",
      50,
      doc.page.height - 85,
      { align: "center" }
    );

  // Finalize PDF
  doc.end();
};
