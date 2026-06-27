/*
     MODULES
*/
import http from "http";

import app from "./src/app.js";
import env from "./src/config/env.js";
import { connectToDatabase } from "./src/database/pg.js";

/*
     CONSTANTS
*/
const server = http.createServer(app);
const { PORT } = env;

// connect to the database and start the server
const startServer = async () => {
  try {
    await connectToDatabase();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

startServer();
