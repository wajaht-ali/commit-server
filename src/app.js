import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { userRoutes } from "./routes/userRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Later, in your route:
app.get("/", (req, res) => {
  const absPath = path.join(__dirname, "public", "index.html");
  res.sendFile(absPath);
});

app.get("/health", (req, res) => {
  res.status(200).send({
    success: true,
    message: "Server Health is 🆗!",
  });
});

app.use("/api/v1/user", userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  // cors
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

export { app, server, io };
