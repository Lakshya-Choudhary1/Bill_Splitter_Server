import http from "http";
import { Server } from "socket.io";
import session from "express-session";

import app from "./src/app.js";
import env from "./src/config/env.js";
import { connectToDatabase } from "./src/database/pg.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

app.set("io", io);
io.engine.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
    },
  }),
);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join group room
  socket.on("join-group", (groupId) => {
    socket.join(`group-${groupId}`);

    console.log(`Socket ${socket.id} joined group-${groupId}`);
  });

  // Join user personal room (for invitations)
  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);

    console.log(`Socket ${socket.id} joined user-${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Connect to PostgreSQL before accepting API requests.
const startServer = async () => {
  try {
    await connectToDatabase();

    server.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

startServer();
