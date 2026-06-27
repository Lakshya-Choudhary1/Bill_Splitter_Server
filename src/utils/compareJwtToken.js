import jwt from "jsonwebtoken";
import env from "../config/env.js";

const compareJwtToken = async (token) => {
     try {
          const result = await jwt.verify(
               token,
               env.JWT_TOKEN_SECRET
          );
          return result;
     } catch (err) {
          return null;
     }
};

export default compareJwtToken;