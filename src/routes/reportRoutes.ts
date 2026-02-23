import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import { getAttendanceReportController, getPaymentsReportController, getStudentAttendanceSummaryController } from "../controllers/reportController";

const router = express.Router();

router.get("/reports/payments", authMiddleware, requireRole("coach"), getPaymentsReportController);
router.get("/reports/attendance", authMiddleware, requireRole("coach"), getAttendanceReportController);
router.get("/reports/students/:studentId/attendance", authMiddleware, requireRole("coach"), getStudentAttendanceSummaryController);

export default router;
