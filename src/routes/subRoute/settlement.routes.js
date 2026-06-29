import { Router } from "express";

import {
  getAllSettlements,
  getSettlementById,
  getSettlements,
  paySplit,
} from "../../controllers/settlement.controller.js";
import userAuthMiddleware from "../../middlewares/userAuth.middleware.js";

const router = Router();


router.post("/split/:splitId/pay",userAuthMiddleware, paySplit);
router.get("/group/:groupId",userAuthMiddleware, getSettlements);
router.get("/",userAuthMiddleware, getAllSettlements);
router.get("/:settlementId",userAuthMiddleware, getSettlementById);

export default router;
