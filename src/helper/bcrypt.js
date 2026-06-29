import bcrypt from "bcryptjs";

import env from "../config/env.js";

const { BCRYPT_SALT } = env;

// Hash plain text passwords before storing them in the database.
export const bcryptHash = async (password) => {
  return bcrypt.hash(password, BCRYPT_SALT);
};

// Compare login input against the stored password hash.
export const bcryptCompare = async (password, password_hashed) => {
  return bcrypt.compare(password, password_hashed);
};
