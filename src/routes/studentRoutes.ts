import express from "express";
import { getAllStudentsController, getStudentsByGroupController, createStudentController, deleteStudentController,getStudentDetailsController,assignStudentToGroupController,
    updateStudentSubscriptionController,
    updateStudentStatusController,
    getStudentPaymentsController, } from "../controllers/studentController";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/students", authMiddleware, requireRole("coach"), getAllStudentsController);
router.get("/students/by-group/:groupId", authMiddleware, requireRole("coach"), getStudentsByGroupController);
router.post("/students", authMiddleware, requireRole("coach"), createStudentController);
router.delete("/students/:id", authMiddleware, requireRole("coach"), deleteStudentController);
router.get("/students/:id", authMiddleware, requireRole("coach"), getStudentDetailsController);
router.post("/students/:id/assign-group", authMiddleware, requireRole("coach"), assignStudentToGroupController);
router.post("/students/:id/subscription", authMiddleware, requireRole("coach"), updateStudentSubscriptionController);
router.post("/students/:id/status", authMiddleware, requireRole("coach"), updateStudentStatusController);
router.get("/students/:id/payments", authMiddleware, requireRole("coach"), getStudentPaymentsController);

export default router;
