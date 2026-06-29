import { query } from "../database/pg.js";

// Create an expense for a group and split it among all other members.
export const createExpense = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { title, description, amount } = req.body;

  try {
    const groupCheck = await query(
      `
      SELECT id
      FROM groups
      WHERE id=$1
      `,
      [groupId],
    );

    if (groupCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    const memberCheck = await query(
      `
      SELECT *
      FROM group_members
      WHERE group_id=$1
      AND user_id=$2
      `,
      [groupId, userId],
    );

    if (memberCheck.rowCount === 0) {
      return res.status(403).json({
        message: "Not a group member",
      });
    }

    const members = await query(
      `
      SELECT user_id
      FROM group_members
      WHERE group_id=$1
      AND user_id != $2
      `,
      [groupId, userId],
    );

    if (members.rowCount === 0) {
      return res.status(400).json({
        message: "No members to split expense",
      });
    }

    const expense = await query(
      `
      INSERT INTO expenses
      (
        group_id,
        paid_by,
        title,
        description,
        amount
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [groupId, userId, title, description, amount],
    );

    // =========================
    // Socket notification
    // =========================

    const io = req.app.get("io");

    io.to(`group-${groupId}`).emit("expense-created", {
      expense: result.rows[0],
      message: "New expense added",
    });

    const expenses = expense.rows[0];
    const splitAmount = amount / (members.rows.length + 1);

    for (const member of members.rows) {
      await query(
        `
        INSERT INTO expense_splits
        (
          expense_id,
          user_id,
          amount_owed
        )
        VALUES ($1, $2, $3)
        `,
        [expenses.id, member.user_id, splitAmount],
      );
    }

    return res.status(201).json({
      message: "Expense created",
      expenses,
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Get every expense for a group after confirming the user is a member.
export const getExpenses = async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  try {
    const checkGroup = await query(
      `
      SELECT id
      FROM groups
      WHERE id=$1
      `,
      [groupId],
    );

    if (checkGroup.rowCount === 0) {
      return res.status(404).json({
        message: "Group does not exist.",
      });
    }

    const checkMember = await query(
      `
      SELECT *
      FROM group_members
      WHERE group_id=$1
      AND user_id=$2
      `,
      [groupId, userId],
    );

    if (checkMember.rowCount === 0) {
      return res.status(403).json({
        message: "Unauthorized access.",
      });
    }

    const expenses = await query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.amount,
        e.currency,
        e.created_at,
        u.id AS paid_by_id,
        u.name AS paid_by_name
      FROM expenses e
      JOIN users u
      ON e.paid_by = u.id
      WHERE e.group_id=$1
      ORDER BY e.created_at DESC
      `,
      [groupId],
    );

    return res.status(200).json({
      expenses: expenses.rows,
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Get one expense with the split details for each owing member.
export const getExpenseById = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const expense = await query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.amount,
        e.currency,
        e.created_at,
        u.id AS paid_by_id,
        u.name AS paid_by_name
      FROM expenses e
      JOIN users u
      ON e.paid_by = u.id
      WHERE e.id=$1
      `,
      [expenseId],
    );

    if (expense.rowCount === 0) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    const splits = await query(
      `
      SELECT
        es.user_id,
        es.amount_owed AS amount,
        es.settled,
        u.name,
        u.email
      FROM expense_splits es
      JOIN users u
      ON es.user_id = u.id
      WHERE es.expense_id=$1
      `,
      [expenseId],
    );

    return res.status(200).json({
      expense: expense.rows[0],
      splits: splits.rows,
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Delete an expense only when the logged-in user paid for it.
export const deleteExpense = async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user.id;

  try {
    const expense = await query(
      `
      SELECT *
      FROM expenses
      WHERE id=$1
      `,
      [expenseId],
    );

    if (expense.rowCount === 0) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    if (String(expense.rows[0].paid_by) !== String(userId)) {
      return res.status(403).json({
        message: "Only payer can delete expense",
      });
    }

    await query(
      `
      DELETE FROM expenses
      WHERE id=$1
      `,
      [expenseId],
    );

    // =========================
    // Socket notification
    // =========================

    const io = req.app.get("io");

    io.to(`group-${deletedExpense.group_id}`).emit("expense-deleted", {
      expenseId: deletedExpense.id,
      message: "Expense deleted",
    });

    return res.status(200).json({
      message: "Expense deleted successfully",
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Get all split records for one expense.
export const getSplits = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const result = await query(
      `
      SELECT
        es.id,
        es.user_id,
        es.amount_owed AS amount,
        es.settled,
        u.name,
        u.email
      FROM expense_splits es
      JOIN users u
      ON es.user_id = u.id
      WHERE es.expense_id=$1
      `,
      [expenseId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No splits found",
      });
    }

    return res.status(200).json({
      splits: result.rows,
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
