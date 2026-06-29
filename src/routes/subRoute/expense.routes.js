import { Router } from "express";

import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  getSplits,
} from "../../controllers/expense.controller.js";
import userAuthMiddleware from "../../middlewares/userAuth.middleware.js";

const router = Router();

// Expense routes.
router.post("/group/:groupId", userAuthMiddleware, createExpense);
router.get("/group/:groupId", userAuthMiddleware, getExpenses);
router.get("/:expenseId", userAuthMiddleware, getExpenseById);
router.delete("/:expenseId", userAuthMiddleware, deleteExpense);

// Split routes.
router.get("/:expenseId/split", userAuthMiddleware, getSplits);

export default router;
