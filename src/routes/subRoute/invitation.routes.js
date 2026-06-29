import { Router } from "express";

import {
  acceptInvitation,
  createInvitation,
  getInvitations,
  rejectInvitation,
} from "../../controllers/invitation.controller.js";
import userAuth from "../../middlewares/userAuth.middleware.js";

const router = Router();

// Invitation routes.
router.post("/group/:groupId/invite", userAuth, createInvitation);
router.get("/", userAuth, getInvitations);
router.post("/:invitationId/accept", userAuth, acceptInvitation);
router.post("/:invitationId/reject", userAuth, rejectInvitation);

export default router;
