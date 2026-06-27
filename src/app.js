/*
     MODULES
*/
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import env from "./config/env.js";

import api from "./routes/api.route.js"

import "./lib/passport.js"
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
    },credentials:true
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
  cookie:{
    sameSite:"lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: env.NODE_ENV === "production"
  }
}));
app.use(passport.initialize());
app.use(passport.session());




app.use("/api",api);

/*
     ROUTES
*/
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Server is running",
    time: new Date(),
  });
});

export default app;
