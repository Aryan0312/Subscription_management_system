// @ts-check

import { pool } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";

export const getAllSubscriptions = asyncHandler(
  async (req: Request, res: Response) => {

    const status = req.query.status as string;

    let query = `
      SELECT
        s.subscription_id,
        s.subscription_number,
        s.status,
        s.start_date,
        s.expiration_date,
        s.next_billing_date,
        s.payment_terms,
        s.total_amount,
        s.created_at,
        s.updated_at,
        
        -- Customer details
        c.contact_id,
        c.company_name,
        c.billing_address,
        c.shipping_address,
        c.tax_id,
        u.user_id AS customer_user_id,
        u.email AS customer_email,
        u.fname AS customer_fname,
        u.lname AS customer_lname,
        u.phone AS customer_phone,
        
        -- Plan details
        rp.plan_id,
        rp.name AS plan_name,
        rp.billing_period,
        rp.is_closable,
        rp.is_pausable,
        rp.is_renewable,
        rp.auto_close_after_days,
        
        -- Created by
        creator.email AS created_by_email,
        creator.fname AS created_by_fname,
        creator.lname AS created_by_lname
        
      FROM subscriptions s
      JOIN contacts c ON s.customer_id = c.contact_id
      JOIN users u ON c.user_id = u.user_id
      JOIN recurring_plans rp ON s.plan_id = rp.plan_id
      JOIN users creator ON s.created_by = creator.user_id
    `;

    const values: any[] = [];

    if (status) {
      query += ` WHERE s.status = $1`;
      values.push(status);
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query, values);

    // Get subscription lines for each subscription
    const subscriptions = await Promise.all(
      result.rows.map(async (sub) => {
        const linesResult = await pool.query(
          `
          SELECT
            sl.line_id,
            sl.quantity,
            sl.unit_price,
            sl.amount,
            p.product_id,
            p.name AS product_name,
            p.type AS product_type,
            t.tax_id,
            t.name AS tax_name,
            t.value AS tax_value,
            t.calculation_type AS tax_type,
            d.discount_id,
            d.name AS discount_name,
            d.type AS discount_type,
            d.value AS discount_value
          FROM subscription_lines sl
          JOIN products p ON sl.product_id = p.product_id
          LEFT JOIN taxes t ON sl.tax_id = t.tax_id
          LEFT JOIN discounts d ON sl.discount_id = d.discount_id
          WHERE sl.subscription_id = $1
          `,
          [sub.subscription_id]
        );

        return {
          subscription_id: sub.subscription_id,
          subscription_number: sub.subscription_number,
          status: sub.status,
          start_date: sub.start_date,
          expiration_date: sub.expiration_date,
          next_billing_date: sub.next_billing_date,
          payment_terms: sub.payment_terms,
          total_amount: sub.total_amount,
          created_at: sub.created_at,
          updated_at: sub.updated_at,
          customer: {
            contact_id: sub.contact_id,
            company_name: sub.company_name,
            billing_address: sub.billing_address,
            shipping_address: sub.shipping_address,
            tax_id: sub.tax_id,
            user: {
              user_id: sub.customer_user_id,
              email: sub.customer_email,
              fname: sub.customer_fname,
              lname: sub.customer_lname,
              phone: sub.customer_phone
            }
          },
          plan: {
            plan_id: sub.plan_id,
            name: sub.plan_name,
            billing_period: sub.billing_period,
            is_closable: sub.is_closable,
            is_pausable: sub.is_pausable,
            is_renewable: sub.is_renewable,
            auto_close_after_days: sub.auto_close_after_days
          },
          lines: linesResult.rows.map(line => ({
            line_id: line.line_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
            amount: line.amount,
            product: {
              product_id: line.product_id,
              name: line.product_name,
              type: line.product_type
            },
            tax: line.tax_id ? {
              tax_id: line.tax_id,
              name: line.tax_name,
              value: line.tax_value,
              type: line.tax_type
            } : null,
            discount: line.discount_id ? {
              discount_id: line.discount_id,
              name: line.discount_name,
              type: line.discount_type,
              value: line.discount_value
            } : null
          })),
          created_by: {
            email: sub.created_by_email,
            fname: sub.created_by_fname,
            lname: sub.created_by_lname
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: subscriptions
    });
  }
);
