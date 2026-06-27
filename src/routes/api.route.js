import {Router} from "express";

import userRoutes from "./subRoute/user.routes.js";
// import groupRoutes from "./subroute/group.routes.js";
// import invitationRoutes from "./subroute/invitation.routes.js";
// import expenseRoutes from "./subroute/expense.routes.js";
// import settlementRoutes from "./subroute/settlement.routes.js";
// import dashboardRoutes from "./subroute/dashboard.routes.js";

const router = Router();

router.use("/user",userRoutes);
// router.use("/groups",groupRoutes);
// router.use("/invitations",invitationRoutes);
// router.use("/expenses",expenseRoutes);
// router.use("/settlements",settlementRoutes);
// router.use("/dashboard",dashboardRoutes);

export default router;