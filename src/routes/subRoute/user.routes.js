import { Router } from "express";
import passport from "passport";

import env from "../../config/env.js";
import {
  checkAuth,
  forgotPassword,
  getProfileById,
  login,
  logout,
  register,
  resendVerifyEmailToken,
  resetPassword,
  updateProfile,
  verifyEmail,
} from "../../controllers/user.controller.js";
import userAuthMiddleware from "../../middlewares/userAuth.middleware.js";

const router = Router();

// Local authentication.
router.post("/register", register);
router.post("/verifyEmail", verifyEmail);
router.post("/resendVerifyEmailToken", resendVerifyEmailToken);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Profile routes.
router.get("/profile", userAuthMiddleware, checkAuth);
router.get("/profile/:id", userAuthMiddleware, getProfileById);
router.patch("/profile", userAuthMiddleware, updateProfile);

// Google OAuth login.
router.get(
  "/google",
  passport.authenticate("googleStrategy", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("googleStrategy", {
    failureRedirect: env.CLIENT_URL,
  }),
  (req, res) => {
    res.redirect(env.CLIENT_URL);
  },
);

export default router;
