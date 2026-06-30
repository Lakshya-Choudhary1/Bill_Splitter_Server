import { Resend } from "resend";

import env from "../config/env.js";
import {
  forgotPasswordTemplate,
  verificationTemplate,
} from "./templates/template.js";

const { RESEND_API_KEY } = env;

const resend = new Resend(RESEND_API_KEY);


// Send verification email
const sendVerificationEmail = async (email, name, token) => {
  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Email Verification For Bill Splitter",
      html: verificationTemplate(name, token),
    });

    console.log(result);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};


// Send forgot password email
const sendForgotPasswordEmail = async (email, link) => {
  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Password Reset For Bill Splitter",
      html: forgotPasswordTemplate(email, link),
    });

    console.log(result);
  } catch (error) {
    console.error("Error sending forgot password email:", error);
    throw new Error("Failed to send forgot password email");
  }
};


export { sendForgotPasswordEmail, sendVerificationEmail };