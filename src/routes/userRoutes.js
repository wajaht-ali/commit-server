import express from "express";
import { getAllUsers, registerUser } from "../controllers/userControllers.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/allUsers", getAllUsers);

export { router as userRoutes };
