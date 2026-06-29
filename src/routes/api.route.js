import { Router } from "express";

import expenseRoutes from "./subRoute/expense.routes.js";
import groupRoutes from "./subRoute/group.routes.js";
import invitationRoutes from "./subRoute/invitation.routes.js";
import settlementRoutes from "./subRoute/settlement.routes.js";
import userRoutes from "./subRoute/user.routes.js";

const router = Router();

// Main API route groups.
router.use("/user", userRoutes);
router.use("/group", groupRoutes);
router.use("/invitation", invitationRoutes);
router.use("/expense", expenseRoutes);
router.use("/settlement", settlementRoutes);

export default router;
