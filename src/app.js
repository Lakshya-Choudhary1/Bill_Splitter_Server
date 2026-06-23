/*
     MODULES
*/
import express from "express";
import helmet from "helmet";
import cors from "cors";
import env from "./config/env.js";

/*
     CONSTANTS
*/
const app = express();
const { WHITELIST_URL } = env;

/*
     MIDDLEWARE
*/
app.use(helmet({}));
app.use(
  cors({
    origin: (origin, cb) => {
      if (WHITELIST_URL.includes(origin) || !origin) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"));
      }
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
     ROUTES
*/
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Server is running",
    time: new Date()
  });
});

export default app;
