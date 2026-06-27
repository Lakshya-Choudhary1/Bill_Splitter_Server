import nodemailer from "nodemailer";
import env from "../config/env.js";
import {
  verificationTemplate,
  forgotPasswordTemplate,
} from "./templates/template.js";

const { NODEMAILER_EMAIL, NODEMAILER_EMAIL_PASSWORD } = env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, name, token) => {
  try {
    const mailOptions = {
      from: NODEMAILER_EMAIL,
      to: email,
      subject: "Email Verification For Bill Splitter",
      html: verificationTemplate(name, token),
    };
    const res = await transporter.sendMail(mailOptions);
    console.log(res.messageId);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

const sendForgotPasswordEmail = async (email, link) => {
  try {
    const mailOptions = {
      from: NODEMAILER_EMAIL,
      to: email,
      subject: "Password Reset For Bill Splitter",
      html: forgotPasswordTemplate(link),
    };
    const res = await transporter.sendMail(mailOptions);
    console.log(res.messageId);
  } catch (error) {
    console.error("Error sending forgot password email:", error);
    throw new Error("Failed to send forgot password email");
  }
};

export { sendVerificationEmail, sendForgotPasswordEmail };
