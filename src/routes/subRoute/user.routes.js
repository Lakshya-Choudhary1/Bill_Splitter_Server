import { Router } from "express";
import passport from "passport";

import userAuthMiddleware from "../../middlewares/userAuth.middleware.js"

import {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resendVerifyEmailToken,
  resetPassword,
  checkAuth,
  getProfileById,
  updateProfile
} from "../../controllers/user.controller.js";
import env from "../../config/env.js";

const router = Router();

router.post("/register", register);

router.post("/verifyEmail", verifyEmail);
router.post("/resendVerifyEmailToken", resendVerifyEmailToken);

router.post("/login", login);
router.get("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/profile",userAuthMiddleware,checkAuth)

router.get("/profile/:id",userAuthMiddleware,getProfileById);

//update user profile
router.patch("/profile",userAuthMiddleware,updateProfile);


// ======================
// Google Login
// ======================
router.get(
  "/google",
  passport.authenticate("googleStrategy", {
    scope: ["profile", "email"],
  }),
);

// ======================
// Google Callback
// ======================
router.get(
  "/google/callback",

  passport.authenticate("googleStrategy", {
    failureRedirect: env.CLIENT_URL,
  }),

  (req, res) => {
    res.redirect(env.CLIENT_URL);
  }
);

export default router;
