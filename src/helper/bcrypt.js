import bcrypt from "bcryptjs";

import env from "../config/env.js"

const {BCRYPT_SALT} = env;

//CONVERT PASSWORD -> HASHED PASSWORD
export const bcryptHash = async(password) =>{
     return await bcrypt.hash(password,BCRYPT_SALT);
}

//RETURN TRUE IF PASSWORD === HASHED PASSWORD
export const bcryptCompare = async(password,password_hashed) =>{
     return await bcrypt.compare(password,password_hashed);
}



