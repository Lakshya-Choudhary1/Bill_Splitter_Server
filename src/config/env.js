import dotenv from "dotenv";

dotenv.config(); // Load environment variables from a .env file into process.env. This allows you to use environment variables in your application without hardcoding them.

const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  WHITELIST_URL: process.env.WHITELIST_URL || [],
  CLIENT_URL:
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173"
      : process.env.CLIENT_URL || "https://bill-splitter-frontend.vercel.app",
    HEALTH_CHECK_URL: process.env.HEALTH_CHECK_URL || "https://bill-splitter-frontend.vercel.app/health",
};

console.log("Client URL:", env.CLIENT_URL);

export default env;
