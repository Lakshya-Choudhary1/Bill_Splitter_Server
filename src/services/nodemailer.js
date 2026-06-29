import nodemailer from "nodemailer";

import env from "../config/env.js";
import {
  forgotPasswordTemplate,
  verificationTemplate,
} from "./templates/template.js";

const { NODEMAILER_EMAIL, NODEMAILER_EMAIL_PASSWORD } = env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_EMAIL_PASSWORD,
  },
});

// Send the one-time code used during account verification.
const sendVerificationEmail = async (email, name, token) => {
  try {
    const mailOptions = {
      from: NODEMAILER_EMAIL,
      to: email,
      subject: "Email Verification For Bill Splitter",
      html: verificationTemplate(name, token),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(result.messageId);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Send the password reset link to the requested account email.
const sendForgotPasswordEmail = async (email, link) => {
  try {
    const mailOptions = {
      from: NODEMAILER_EMAIL,
      to: email,
      subject: "Password Reset For Bill Splitter",
      html: forgotPasswordTemplate(email, link),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(result.messageId);
  } catch (error) {
    console.error("Error sending forgot password email:", error);
    throw new Error("Failed to send forgot password email");
  }
};

export { sendForgotPasswordEmail, sendVerificationEmail };
