import jwt from "jsonwebtoken";

import env from "../config/env.js";

// Return decoded token data, or null when the cookie token is invalid/expired.
const compareJwtToken = async (token) => {
  try {
    const result = jwt.verify(token, env.JWT_TOKEN_SECRET);
    return result;
  } catch (err) {
    return null;
  }
};

export default compareJwtToken;
