import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import { getClassesController, deleteClassController } from "../controllers/classController";

const router = express.Router();

router.get("/", authMiddleware, requireRole("coach"), getClassesController);
router.delete("/:id", authMiddleware, requireRole("coach"), deleteClassController);

export default router;
