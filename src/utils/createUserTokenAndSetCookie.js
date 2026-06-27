import jwt from "jsonwebtoken";
import env from "../config/env.js";

const {JWT_TOKEN_SECRET,JWT_TOKEN_NAME , NODE_ENV} = env;

const createUserTokenAndSetCookie = async(res,userId) =>{
     const jwtToken = await jwt.sign({userId},JWT_TOKEN_SECRET,{
          expiresIn:'7d'
     })
     
     res.cookie(JWT_TOKEN_NAME, jwtToken, {
          maxAge: 1000 * 60 * 60 * 24 * 7,
          sameSite: "none",
          secure: NODE_ENV === "production",
          httpOnly: true,
     });

     return jwtToken;
};

export default createUserTokenAndSetCookie;