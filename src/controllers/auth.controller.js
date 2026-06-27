import { query } from "../database/pg.js";
import { nanoid } from "nanoid";

import createUserTokenAndSetCookie from "../utils/createUserTokenAndSetCookie.js";

import { bcryptCompare, bcryptHash } from "../helper/bcrypt.js";
import { validateEmail } from "../helper/validator.js";

import env from "../config/env.js";

//EMAIL SERVICES
import {
  sendVerificationEmail,
  sendForgotPasswordEmail,
} from "../services/nodemailer.js";

// =============================
// REGISTER USER
// =============================
export const register = async (req, res) => {
  const { name, email, password, upi_id } = req.body;

  // Check required fields
  if (!name?.trim() || !email?.trim() || !password?.trim() || !upi_id?.trim()) {
    return res.status(400).json({
      message: "INVALID CREDENTIALS",
    });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({
      message: "PASSWORD LENGTH SHOULD BE AT LEAST 6",
    });
  }

  // Email validation
  const isValidEmail = await validateEmail(email);

  if (!isValidEmail) {
    return res.status(400).json({
      message: "INVALID EMAIL",
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email=$1", [
      normalizedEmail,
    ]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "EMAIL ALREADY EXISTS",
      });
    }

    // Hash password before storing
    const password_hashed = await bcryptHash(password);

    // Generate invite code
    const invite_code = nanoid(env.INVITE_CODE_LENGTH);

    // Generate email verification token
    const verification_token = nanoid(env.VERIFICATION_TOKEN_LENGTH);

    // Token expires after 15 minutes
    const verification_token_expiry = new Date(Date.now() + 15 * 60 * 1000);

    // Create user
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
        VALUES
        ($1,$2,$3,$4,$5,$6,$7)

        RETURNING 
        id,
        name,
        email,
        upi_id,
        invite_code,
        is_verified,
        avatar_url,
        currency;
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

    await sendVerificationEmail(normalizedEmail, name, verification_token);

    // Create JWT cookie
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

// =============================
// VERIFY EMAIL
// =============================
export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "TOKEN REQUIRED",
    });
  }

  try {
    // Find user with token
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

    // Check token expiry
    if (new Date(result.rows[0].verification_token_expiry) < new Date()) {
      return res.status(400).json({
        message: "TOKEN EXPIRED",
      });
    }

    // Verify user
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

// =============================
// LOGIN USER
// =============================
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

    // Find user
    const result = await query(
      "SELECT id,currency,password_hashed,avatar_url,name,email,upi_id,invite_code,is_verified FROM users WHERE email=$1",
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "USER NOT FOUND",
      });
    }

    const user = result.rows[0];

    // Compare password
    const isPasswordValid = await bcryptCompare(password, user.password_hashed);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "INVALID PASSWORD",
      });
    }

    // Create JWT cookie
    await createUserTokenAndSetCookie(res, user.id);

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      upi_id: user.upi_id,
      invite_code: user.invite_code,
      is_verified: user.is_verified,
      avatar_url: user.avatar_url,
      currency:user.currency
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// =============================
// LOGOUT USER
// =============================

export const logout = async (req, res) => {
  try {
    // remove JWT cookie if exists
    res.clearCookie(env.JWT_TOKEN_NAME);

    // Passport logout
    if (req.isAuthenticated?.()) {
      await new Promise((resolve, reject) => {
        req.logout((err) => {
          if (err) {
            return reject(err);
          }

          resolve();
        });
      });
    }

    // Destroy session
    if (req.session) {
      await new Promise((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            return reject(err);
          }

          resolve();
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

// =============================
// RESEND EMAIL VERIFICATION TOKEN
// =============================

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
    // Find user
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

    // Already verified
    if (result.rows[0].is_verified) {
      return res.status(400).json({
        message: "EMAIL ALREADY VERIFIED",
      });
    }

    // create new token
    const verification_token = nanoid(env.VERIFICATION_TOKEN_LENGTH);

    // expires in 15 minutes
    const verification_token_expiry = new Date(Date.now() + 15 * 60 * 1000);

    // update token
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

    await sendVerificationEmail(
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

// =============================
// FORGOT PASSWORD
// =============================

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Check email
  if (!email?.trim()) {
    return res.status(400).json({
      message: "EMAIL REQUIRED",
    });
  }

  // Validate email
  const isValidEmail = await validateEmail(email);

  if (!isValidEmail) {
    return res.status(400).json({
      message: "INVALID EMAIL",
    });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    // Find user
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

    // Check if existing reset token is still valid
    if (
      user.reset_password_token &&
      new Date(user.reset_password_token_expiry) > new Date()
    ) {
      const link = `${env.CLIENT_URL}/reset-password/${user.reset_password_token}`;

      // Send existing reset link
      await sendForgotPasswordEmail(normalizedEmail, link);

      return res.status(200).json({
        message: "RESET TOKEN SENT TO EMAIL",
      });
    }

    // Generate new reset token
    const reset_password_token = nanoid(env.RESET_PASSWORD_TOKEN_LENGTH);

    // Token expires after 15 minutes
    const reset_password_token_expiry = new Date(Date.now() + 15 * 60 * 1000);

    // Save token in database
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

    // Create reset URL
    const link = `${env.CLIENT_URL}/reset-password/${reset_password_token}`;

    // Send email
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
// =============================
// RESET PASSWORD
// =============================

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  // Validate token
  if (!token?.trim()) {
    return res.status(400).json({
      message: "TOKEN REQUIRED",
    });
  }

  // Validate password
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
    // Find user using reset token
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

    // Check token expiry
    if (new Date(user.reset_password_token_expiry) < new Date()) {
      return res.status(400).json({
        message: "TOKEN EXPIRED",
      });
    }

    // Hash new password
    const password_hashed = await bcryptHash(password);

    // Update password and remove token
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

export const checkAuth = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Email not verified",
      });
    }

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
      WHERE id=$1;
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


export const updateProfile = async(req,res) => {

  try {

    const userId = req.user.id;

    const {
      name,
      upi_id,
      avatar_url,
      currency
    } = req.body;


    const result = await query(
      `
      UPDATE users
      SET
        name=$1,
        upi_id=$2,
        avatar_url=$3,
        currency=$4
      WHERE id=$5
      RETURNING
        id,
        name,
        upi_id,
        email,
        avatar_url,
        currency,
        is_verified
      `,
      [
        name,
        upi_id,
        avatar_url,
        currency,
        userId
      ]
    );


    if(result.rowCount === 0){
      return res.status(404).json({
        message:"User not found"
      });
    }


    return res.status(200).json({
      message:"Profile updated",
      user:result.rows[0]
    });


  } catch(err) {

    console.error(err);

    return res.status(500).json({
      message:"Internal Server Error"
    });

  }

};