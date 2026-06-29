import crypto from "crypto";

import env from "../config/env.js";
import razorpay from "../config/razorpay.js";
import { query } from "../database/pg.js";

// Create a Razorpay order for a split owed by the logged-in user.
export const paySplit = async (req, res) => {
  const { splitId } = req.params;
  const userId = req.user.id;

  try {
    const split = await query(
      `
      SELECT
        es.*,
        es.amount_owed AS amount,
        e.group_id,
        e.id AS expense_id,
        e.paid_by
      FROM expense_splits es
      JOIN expenses e
      ON es.expense_id = e.id
      WHERE es.id=$1
      `,
      [splitId],
    );

    if (split.rowCount === 0) {
      return res.status(404).json({
        message: "Split not found",
      });
    }

    const data = split.rows[0];

    if (String(data.user_id) !== String(userId)) {
      return res.status(403).json({
        message: "You cannot pay this split",
      });
    }

    if (data.settled) {
      return res.status(400).json({
        message: "Already settled",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(data.amount * 100),
      currency: "INR",
      receipt: `split_${splitId}`,
      notes: {
        splitId,
        expenseId: data.expense_id,
        fromUser: userId,
        toUser: data.paid_by,
      },
    });

    await query(
      `
      UPDATE expense_splits
      SET razorpay_order_id=$1
      WHERE id=$2
      `,
      [order.id, splitId],
    );

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Verify Razorpay webhooks, mark the split paid, and store settlement history.
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({
        message: "Invalid signature",
      });
    }

    const event = Buffer.isBuffer(req.body) ? JSON.parse(body) : req.body;
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;

    const split = await query(
      `
      SELECT
        es.id,
        es.user_id,
        es.amount_owed,
        e.group_id,
        e.id AS expense_id,
        e.paid_by
      FROM expense_splits es
      JOIN expenses e
      ON es.expense_id = e.id
      WHERE es.razorpay_order_id=$1
      `,
      [orderId],
    );

    if (split.rowCount === 0) {
      return res.json({
        received: true,
      });
    }

    const data = split.rows[0];

    await query(
      `
      UPDATE expense_splits
      SET settled=true
      WHERE id=$1
      `,
      [data.id],
    );

    await query(
      `
      INSERT INTO settlements
      (
        group_id,
        expense_id,
        from_user,
        to_user,
        amount,
        payment_method,
        status,
        razorpay_order_id,
        razorpay_payment_id,
        paid_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `,
      [
        data.group_id,
        data.expense_id,
        data.user_id,
        data.paid_by,
        payment.amount / 100,
        "upi",
        "completed",
        orderId,
        payment.id,
      ],
    );

    // =========================
    // Socket notification
    // =========================

    const io = req.app.get("io");

    io.to(`group-${groupId}`).emit("settlement-created", {
      settlement: result.rows[0],
      message: "New payment recorded",
    });

    return res.json({
      received: true,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Webhook failed",
    });
  }
};

// Get all settlements for a group.
export const getSettlements = async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await query(
      `
      SELECT
        s.*,
        f.email AS from_user_email,
        t.email AS to_user_email
      FROM settlements s
      JOIN users f
      ON s.from_user=f.id
      JOIN users t
      ON s.to_user=t.id
      WHERE s.group_id=$1
      ORDER BY s.created_at DESC
      `,
      [groupId],
    );

    return res.json({
      settlements: result.rows,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Get one settlement by id.
export const getSettlementById = async (req, res) => {
  const { settlementId } = req.params;

  try {
    const result = await query(
      `
      SELECT *
      FROM settlements
      WHERE id=$1
      `,
      [settlementId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Settlement not found",
      });
    }

    return res.json({
      settlement: result.rows[0],
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Get all settlements where the logged-in user paid or received money.
export const getAllSettlements = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `
      SELECT *
      FROM settlements
      WHERE from_user=$1
      OR to_user=$1
      ORDER BY created_at DESC
      `,
      [userId],
    );

    return res.json({
      settlements: result.rows,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
