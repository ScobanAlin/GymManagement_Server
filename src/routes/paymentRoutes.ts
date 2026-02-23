import express from "express";
import {
    getAllPaymentsController,
    getPaymentsByStudentController,
    createPaymentController,
    deletePaymentController,
    updatePaymentController,
    getUnpaidStudentsController,
    getAllStudentsWithPaymentStatusController,
    getAllStoredMonthsController
} from "../controllers/paymentController";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/payments/stored-months", authMiddleware, requireRole("coach"), getAllStoredMonthsController);
router.get("/payments/unpaid", authMiddleware, requireRole("coach"), getUnpaidStudentsController);
router.get("/payments/status-by-month", authMiddleware, requireRole("coach"), getAllStudentsWithPaymentStatusController);
router.get("/payments", authMiddleware, requireRole("coach"), getAllPaymentsController);
router.get("/payments/by-student/:studentId", authMiddleware, requireRole("coach"), getPaymentsByStudentController);
router.post("/payments", authMiddleware, requireRole("coach"), createPaymentController);
router.delete("/payments/:id", authMiddleware, requireRole("coach"), deletePaymentController);
router.put("/payments/:id", authMiddleware, requireRole("coach"), updatePaymentController);

export default router;
