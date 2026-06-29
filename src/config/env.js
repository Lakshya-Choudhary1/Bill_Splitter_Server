import dotenv from "dotenv";

// Load all .env values in one place so app modules do not read process.env directly.
dotenv.config();

const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV || "development",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:
    process.env.NODE_ENV === "production"
      ? process.env.GOOGLE_CALLBACK_URL
      : "/api/user/google/callback",

  BCRYPT_SALT: Number(process.env.BCRYPT_SALT),
  EXPIRY_TIME: Number(process.env.EXPIRY_TIME),
  JWT_TOKEN_NAME: process.env.JWT_TOKEN_NAME,
  JWT_TOKEN_SECRET: process.env.JWT_TOKEN_SECRET,

  INVITE_CODE_LENGTH: Number(process.env.INVITE_CODE_LENGTH),
  VERIFICATION_TOKEN_LENGTH: Number(process.env.VERIFICATION_TOKEN_LENGTH),
  RESET_PASSWORD_TOKEN_LENGTH: Number(process.env.RESET_PASSWORD_TOKEN_LENGTH),

  SESSION_SECRET: process.env.SESSION_SECRET,
  NODEMAILER_EMAIL: process.env.NODEMAILER_EMAIL,
  NODEMAILER_EMAIL_PASSWORD: process.env.NODEMAILER_EMAIL_PASSWORD,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  WHITELIST_URL: process.env.WHITELIST_URL || [],

  SERVER_URL:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.SERVER_URL,
  CLIENT_URL:
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173"
      : process.env.CLIENT_URL,
};

export default env;
