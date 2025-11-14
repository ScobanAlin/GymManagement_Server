import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import { getClassesController } from "../controllers/classController";

const router = express.Router();

router.get("/", authMiddleware, requireRole("coach"), getClassesController);

export default router;
