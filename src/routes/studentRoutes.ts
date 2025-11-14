import express from "express";
import { getAllStudentsController, getStudentsByGroupController, createStudentController, deleteStudentController } from "../controllers/studentController";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/students", authMiddleware, requireRole("coach"), getAllStudentsController);
router.get("/students/by-group/:groupId", authMiddleware, requireRole("coach"), getStudentsByGroupController);
router.post("/students", authMiddleware, requireRole("coach"), createStudentController);
router.delete("/students/:id", authMiddleware, requireRole("coach"), deleteStudentController);


export default router;
