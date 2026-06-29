import { Router } from "express";

import {
  acceptInvitation,
  createInvitation,
  getInvitations,
  rejectInvitation,
} from "../../controllers/invitation.controller.js";
import userAuthMiddleware from "../../middlewares/userAuth.middleware.js";

const router = Router();

// Invitation routes.
router.post("/group/:groupId/invite", userAuthMiddleware, createInvitation);
router.get("/", userAuthMiddleware, getInvitations);
router.post("/:invitationId/accept", userAuthMiddleware, acceptInvitation);
router.post("/:invitationId/reject", userAuthMiddleware, rejectInvitation);

export default router;
