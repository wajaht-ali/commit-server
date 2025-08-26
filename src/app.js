import express from "express";
import cors from "cors";
import { userRoutes } from "./routes/userRoutes.js";

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
    message: "Home route is working!!!",
  });
});

app.get("/health", (req, res) => {
  res.status(200).send({
    success: true,
    message: "Server Health is 🆗!",
  });
});

app.use("/api/v1/user", userRoutes);

export default app;
