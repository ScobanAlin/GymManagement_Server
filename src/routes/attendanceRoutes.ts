import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import {
    getUpcomingClassesController,
    getClassAttendanceController,
    getGroupStudentsController,
    updateAttendanceController,
    getOrCreateAttendanceController,
} from "../controllers/attendanceController";

const router = express.Router();

// 🔹 Attendance Routes (coach only)
router.get("/attendance/upcoming", authMiddleware, requireRole("coach"), getUpcomingClassesController);
router.get("/attendance/classes/:classId", authMiddleware, requireRole("coach"), getClassAttendanceController);
router.get("/attendance/groups/:groupId/students", authMiddleware, requireRole("coach"), getGroupStudentsController);
router.put("/attendance/:attendanceId", authMiddleware, requireRole("coach"), updateAttendanceController);
router.post("/attendance/classes/:classId/students/:studentId", authMiddleware, requireRole("coach"), getOrCreateAttendanceController);

export default router;
