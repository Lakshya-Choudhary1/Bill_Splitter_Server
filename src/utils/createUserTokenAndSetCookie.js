import jwt from "jsonwebtoken";

import env from "../config/env.js";

const { JWT_TOKEN_SECRET, JWT_TOKEN_NAME, NODE_ENV } = env;

// Create the login token and attach it to the response as an HTTP-only cookie.
const createUserTokenAndSetCookie = async (res, userId) => {
  const jwtToken = jwt.sign({ userId }, JWT_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  res.cookie(JWT_TOKEN_NAME, jwtToken, {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: NODE_ENV === "production" ? "none" : "lax",
    secure: NODE_ENV === "production",
    httpOnly: true,
  });

  return jwtToken;
};

export default createUserTokenAndSetCookie;
