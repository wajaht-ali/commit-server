import express from "express";
import {
  getAllUsers,
  getSingleUser,
  resetPassword,
  processAuthUser,
  updateUser
} from "../controllers/userControllers.js";
import { isAdmin, isSignedIn } from "../middlewares/user.middlewares.js";

const router = express.Router();

router.post("/register", processAuthUser);
router.post("/reset-password", resetPassword);
router.post("/googleSignup", processAuthUser);
router.get("/allUsers", isSignedIn, isAdmin, getAllUsers);
router.get("/singleUser/:id", isSignedIn, getSingleUser);
router.put("/updateUser/:id", isSignedIn, updateUser);

export { router as userRoutes };

