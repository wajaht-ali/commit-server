import express from "express";
import { codeExecution } from "../controllers/codeController.js";
const router = express.Router();

router.post("/execute", codeExecution);

export { router as codeRoutes };
