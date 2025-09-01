import express from "express";
import {
  getAllUsers,
  loginUser,
  registerUser,
} from "../controllers/userControllers.js";
import { isAdmin, isSignedIn } from "../middlewares/user.middlewares.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/allUsers", isSignedIn, isAdmin, getAllUsers);

export { router as userRoutes };
