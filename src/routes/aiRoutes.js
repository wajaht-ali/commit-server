import express from "express";
import { generateCode } from "../controllers/aiController.js";

const router = express.Router();

router.post("/code-generation", generateCode);

export { router as aiRoutes };
