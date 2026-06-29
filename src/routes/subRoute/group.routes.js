import { Router } from "express";

import {
  addMember,
  createGroup,
  deleteGroup,
  getGroupById,
  getGroups,
  getMembers,
  removeMember,
  updateGroup,
} from "../../controllers/group.controller.js";
import userAuthMiddleware from "../../middlewares/userAuth.middleware.js";

const router = Router();

// Group CRUD routes.
router.post("/create", userAuthMiddleware, createGroup);
router.get("/all", userAuthMiddleware, getGroups);
router.get("/:id", userAuthMiddleware, getGroupById);
router.patch("/:id", userAuthMiddleware, updateGroup);
router.delete("/:id", userAuthMiddleware, deleteGroup);

// Group member routes.
router.get("/:groupId/member", userAuthMiddleware, getMembers);
router.post("/:groupId/member/:memberId", userAuthMiddleware, addMember);
router.delete("/:groupId/member/:memberId", userAuthMiddleware, removeMember);

export default router;
