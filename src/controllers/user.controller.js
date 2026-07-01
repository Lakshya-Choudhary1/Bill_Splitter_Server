import { nanoid } from "nanoid";

import env from "../config/env.js";
import { query } from "../database/pg.js";
import { bcryptCompare, bcryptHash } from "../helper/bcrypt.js";
import { validateEmail } from "../helper/validator.js";
import {
  sendForgotPasswordEmail,
  sendVerificationEmail,
} from "../services/resend.js";
import createUserTokenAndSetCookie from "../utils/createUserTokenAndSetCookie.js";

// Register a new local user and send the email verification code.
export const register = async (req, res) => {
  const { name, email, password, upi_id } = req.body;

  if (!name?.trim() || !email?.trim() || !password?.trim() || !upi_id?.trim()) {
    return res.status(400).json({
      message: "INVALID CREDENTIALS",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "PASSWORD LENGTH SHOULD BE AT LEAST 6",
    });
  }

  const isValidEmail = await validateEmail(email);

  if (!isValidEmail) {
    return res.status(400).json({
      message: "INVALID EMAIL",
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await query("SELECT id FROM users WHERE email=$1", [
      normalizedEmail,
    ]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "EMAIL ALREADY EXISTS",
      });
    }

    const password_hashed = await bcryptHash(password);
    const invite_code = nanoid(env.INVITE_CODE_LENGTH);
    const verification_token = nanoid(env.VERIFICATION_TOKEN_LENGTH);
    const verification_token_expiry = new Date(Date.now() + 15 * 60 * 1000);

    const result = await query(
      `
      INSERT INTO users
      (
        name,
        email,
        password_hashed,
        upi_id,
        invite_code,
        verification_token,
        verification_token_expiry
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        name,
        email,
        upi_id,
        invite_code,
        is_verified,
        avatar_url,
        currency
      `,
      [
        name,
        normalizedEmail,
        password_hashed,
        upi_id,
        invite_code,
        verification_token,
        verification_token_expiry,
      ],
    );

    sendVerificationEmail(normalizedEmail, name, verification_token);
    await createUserTokenAndSetCookie(res, result.rows[0].id);

    return res.status(201).json({
      message: "USER CREATED",
      user: result.rows[0],
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Verify a local account with the token sent by email.
export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "TOKEN REQUIRED",
    });
  }

  try {
    const result = await query(
      `
      SELECT
        id,
        verification_token_expiry
      FROM users
      WHERE verification_token=$1
      `,
      [token],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "INVALID TOKEN",
      });
    }

    if (new Date(result.rows[0].verification_token_expiry) < new Date()) {
      return res.status(400).json({
        message: "TOKEN EXPIRED",
      });
    }

    await query(
      `
      UPDATE users
      SET
        is_verified=true,
        verification_token=NULL,
        verification_token_expiry=NULL
      WHERE id=$1
      `,
      [result.rows[0].id],
    );

    return res.json({
      message: "EMAIL VERIFIED SUCCESSFULLY",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Log in a local user and set the JWT cookie.
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({
      message: "INVALID CREDENTIALS",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "PASSWORD LENGTH SHOULD BE AT LEAST 6",
    });
  }

  const isValidEmail = await validateEmail(email);

  if (!isValidEmail) {
    return res.status(400).json({
      message: "INVALID EMAIL",
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    const result = await query(
      `
      SELECT
        id,
        currency,
        password_hashed,
        avatar_url,
        name,
        email,
        upi_id,
        invite_code,
        is_verified
      FROM users
      WHERE email=$1
      `,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "USER NOT FOUND",
      });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcryptCompare(password, user.password_hashed);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "INVALID PASSWORD",
      });
    }

    await createUserTokenAndSetCookie(res, user.id);

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        upi_id: user.upi_id,
        invite_code: user.invite_code,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
        currency: user.currency,
      },
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Clear both JWT and Passport session authentication.
export const logout = async (req, res) => {
  try {
    res.clearCookie(env.JWT_TOKEN_NAME);

    if (req.isAuthenticated?.()) {
      await new Promise((resolve, reject) => {
        req.logout((err) => {
          if (err) {
            return reject(err);
          }

          return resolve();
        });
      });
    }

    if (req.session) {
      await new Promise((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            return reject(err);
          }

          return resolve();
        });
      });

      res.clearCookie("connect.sid");
    }

    return res.status(200).json({
      message: "USER LOGOUT SUCCESSFULLY",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Send a fresh email verification token to an unverified account.
export const resendVerifyEmailToken = async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({
      message: "EMAIL REQUIRED",
    });
  }

  const isValidEmail = await validateEmail(email);

  if (!isValidEmail) {
    return res.status(400).json({
      message: "INVALID EMAIL",
    });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    const result = await query(
      `
      SELECT
        id,
        is_verified,
        name
      FROM users
      WHERE email=$1
      `,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "USER NOT FOUND",
      });
    }

    if (result.rows[0].is_verified) {
      return res.status(400).json({
        message: "EMAIL ALREADY VERIFIED",
      });
    }

    const verification_token = nanoid(env.VERIFICATION_TOKEN_LENGTH);
    const verification_token_expiry = new Date(Date.now() + 15 * 60 * 1000);

    await query(
      `
      UPDATE users
      SET
        verification_token=$1,
        verification_token_expiry=$2
      WHERE id=$3
      `,
      [verification_token, verification_token_expiry, result.rows[0].id],
    );

     sendVerificationEmail(
      normalizedEmail,
      result.rows[0].name,
      verification_token,
    );

    return res.status(200).json({
      message: "VERIFICATION TOKEN SENT",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Create or reuse a password reset token and email the reset link.
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({
      message: "EMAIL REQUIRED",
    });
  }

  const isValidEmail = await validateEmail(email);

  if (!isValidEmail) {
    return res.status(400).json({
      message: "INVALID EMAIL",
    });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    const result = await query(
      `
      SELECT
        id,
        reset_password_token,
        reset_password_token_expiry
      FROM users
      WHERE email=$1
      `,
      [normalizedEmail],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "EMAIL NOT EXISTS",
      });
    }

    const user = result.rows[0];

    if (
      user.reset_password_token &&
      new Date(user.reset_password_token_expiry) > new Date()
    ) {
      const link = `${env.CLIENT_URL}/reset-password/${user.reset_password_token}`;

      sendForgotPasswordEmail(normalizedEmail, link);

      return res.status(200).json({
        message: "RESET TOKEN SENT TO EMAIL",
      });
    }

    const reset_password_token = nanoid(env.RESET_PASSWORD_TOKEN_LENGTH);
    const reset_password_token_expiry = new Date(Date.now() + 15 * 60 * 1000);

    await query(
      `
      UPDATE users
      SET
        reset_password_token=$1,
        reset_password_token_expiry=$2
      WHERE email=$3
      `,
      [reset_password_token, reset_password_token_expiry, normalizedEmail],
    );

    const link = `${env.CLIENT_URL}/reset-password/${reset_password_token}`;

    await sendForgotPasswordEmail(normalizedEmail, link);

    return res.status(200).json({
      message: "RESET TOKEN SENT TO EMAIL",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Reset the password once a valid reset token is provided.
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token?.trim()) {
    return res.status(400).json({
      message: "TOKEN REQUIRED",
    });
  }

  if (!password?.trim()) {
    return res.status(400).json({
      message: "PASSWORD REQUIRED",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "PASSWORD LENGTH SHOULD BE AT LEAST 6",
    });
  }

  try {
    const result = await query(
      `
      SELECT
        id,
        reset_password_token_expiry
      FROM users
      WHERE reset_password_token=$1
      `,
      [token],
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "INVALID TOKEN",
      });
    }

    const user = result.rows[0];

    if (new Date(user.reset_password_token_expiry) < new Date()) {
      return res.status(400).json({
        message: "TOKEN EXPIRED",
      });
    }

    const password_hashed = await bcryptHash(password);

    await query(
      `
      UPDATE users
      SET
        password_hashed=$1,
        reset_password_token=NULL,
        reset_password_token_expiry=NULL
      WHERE id=$2
      `,
      [password_hashed, user.id],
    );

    return res.status(200).json({
      message: "PASSWORD UPDATED SUCCESSFULLY",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Return the authenticated profile stored by the auth middleware.
export const checkAuth = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      user,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Fetch another user's public profile details.
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Missing Credentials.",
      });
    }

    const user = req.user;

    if (user.id.toString() === id) {
      return res.status(400).json({
        message: "Invalid Request.",
      });
    }

    const result = await query(
      `
      SELECT
        id,
        email,
        name,
        upi_id,
        avatar_url,
        currency
      FROM users
      WHERE id=$1
      `,
      [Number(id)],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No friend exists.",
      });
    }

    return res.status(200).json({
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal Server Error.",
    });
  }
};

// Update the logged-in user's editable profile fields.
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, upi_id, currency } = req.body;

    const result = await query(
      `
      UPDATE users
      SET
        name=$1,
        upi_id=$2,
        currency=$3
      WHERE id=$4
      RETURNING
        id,
        name,
        upi_id,
        email,
        avatar_url,
        currency,
        is_verified
      `,
      [name, upi_id, currency, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated",
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar_url } = req.body;

     const result = await query(
          `
          UPDATE users
          SET
            avatar_url=$1
          WHERE id=$2   
          RETURNING
               id,
               name,
               upi_id,
               email,
               avatar_url,
               currency,
               is_verified
          `,
          [avatar_url, userId],
        );

     if (result.rowCount === 0) {
          return res.status(404).json({
               message: "User not found",
          });
     }    

     return res.status(200).json({
          message: "Avatar updated",
          success: true,
          user: result.rows[0],
     });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};