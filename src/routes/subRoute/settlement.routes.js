import { Router } from "express";

import {
  getAllSettlements,
  getSettlementById,
  getSettlements,
  paySplit,
} from "../../controllers/settlement.controller.js";
import userAuth from "../../middlewares/userAuth.middleware.js";

const router = Router();

// All routes below require a logged-in user.
router.use(userAuth);

router.post("/splits/:splitId/pay", paySplit);
router.get("/groups/:groupId", getSettlements);
router.get("/", getAllSettlements);
router.get("/:settlementId", getSettlementById);

export default router;
