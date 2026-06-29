import validator from "validator";

// Validate user email before running auth-related database queries.
export const validateEmail = (email) => {
  return validator.isEmail(email);
};

