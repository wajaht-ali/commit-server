import express from "express";
import { getAllUsers, loginUser, registerUser } from "../controllers/userControllers.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/allUsers", getAllUsers);

export { router as userRoutes };
