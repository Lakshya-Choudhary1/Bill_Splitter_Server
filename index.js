/*
     MODULES
*/
import http from "http";
import app from "./src/app.js";
import env from "./src/config/env.js";

/*
     CONSTANTS
*/
const server = http.createServer(app);
const { PORT } = env;
/*
     SERVER
*/
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
