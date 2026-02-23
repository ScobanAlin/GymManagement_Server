import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import { createNotificationController, deleteNotificationController, getAllNotificationsController, updateNotificationReadController } from "../controllers/notificationController";

const router = express.Router();

router.get("/notifications", authMiddleware, requireRole("coach"), getAllNotificationsController);
router.post("/notifications", authMiddleware, requireRole("coach"), createNotificationController);
router.put("/notifications/:id/read", authMiddleware, requireRole("coach"), updateNotificationReadController);
router.delete("/notifications/:id", authMiddleware, requireRole("coach"), deleteNotificationController);

export default router;
