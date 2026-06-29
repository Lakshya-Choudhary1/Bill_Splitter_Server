import env from "../config/env.js";
import { query } from "../database/pg.js";
import compareJwtToken from "../utils/compareJwtToken.js";

const userAuth = async (req, res, next) => {
  try {
    // Passport stores Google-authenticated users in the active session.
    if (req.isAuthenticated?.()) {
      return next();
    }

    // Local login users are authenticated through the signed JWT cookie.
    const token = req.cookies?.[env.JWT_TOKEN_NAME];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = await compareJwtToken(token);

    if (!decoded?.userId) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    const result = await query(
      `
      SELECT
        id,
        name,
        email,
        upi_id,
        is_verified,
        avatar_url,
        invite_code
      FROM users
      WHERE id=$1
      `,
      [decoded.userId],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = result.rows[0];

    return next();
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default userAuth;
