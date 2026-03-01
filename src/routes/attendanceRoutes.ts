import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import {
    getUpcomingClassesController,
    getClassAttendanceController,
    getGroupStudentsController,
    markPresentController,
    markAbsentController,
} from "../controllers/attendanceController";

const router = express.Router();

// 🔹 Attendance Routes (coach only)
router.get("/attendance/upcoming", authMiddleware, requireRole("coach"), getUpcomingClassesController);
router.get("/attendance/classes/:classId", authMiddleware, requireRole("coach"), getClassAttendanceController);
router.get("/attendance/groups/:groupId/students", authMiddleware, requireRole("coach"), getGroupStudentsController);
router.post("/attendance/classes/:classId/students/:studentId/present", authMiddleware, requireRole("coach"), markPresentController);
router.post("/attendance/classes/:classId/students/:studentId/absent", authMiddleware, requireRole("coach"), markAbsentController);

export default router;
