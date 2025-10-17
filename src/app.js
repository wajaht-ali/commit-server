import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { userRoutes } from "./routes/userRoutes.js";
import { codeRoutes } from "./routes/codeRoutes.js";
import { aiRoutes } from "./routes/aiRoutes.js";

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

app.get("/", (req, res) => {
  res.status(200).send({
    success: true,
    message: "Welcome to Commit Server! 🚀",
  });
});

app.get("/health", (req, res) => {
  res.status(200).send({
    success: true,
    message: "Server Health is 🆗!",
  });
});

const routePrefix = "/api/v1";
app.use(`${routePrefix}/user`, userRoutes);
app.use(`${routePrefix}/code`, codeRoutes);
app.use(`${routePrefix}/ai`, aiRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

export { app, server, io };
