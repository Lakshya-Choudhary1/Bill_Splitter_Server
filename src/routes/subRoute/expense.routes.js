import { Router } from "express";

import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  getSplits,
} from "../../controllers/expense.controller.js";
import userAuth from "../../middlewares/userAuth.middleware.js";

const router = Router();

// Expense routes.
router.post("/groups/:groupId", userAuth, createExpense);
router.get("/groups/:groupId", userAuth, getExpenses);
router.get("/:expenseId", userAuth, getExpenseById);
router.delete("/:expenseId", userAuth, deleteExpense);

// Split routes.
router.get("/:expenseId/splits", userAuth, getSplits);

export default router;
