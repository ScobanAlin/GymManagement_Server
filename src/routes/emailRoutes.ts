import express from "express";
import { sendPaymentReminderController } from "../controllers/emailController";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/students/:id/send-payment-reminder", authMiddleware, requireRole("coach"), sendPaymentReminderController);

export default router;
