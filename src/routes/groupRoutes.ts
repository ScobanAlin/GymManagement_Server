import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import {
    getGroupsController,
    createGroupController,
    deleteGroupController,
    getGroupClassesController,
    getGroupStudentsController,
    getGroupScheduleController,
    deleteGroupScheduleSlotController,
    getGroupPastClassesController,
} from "../controllers/groupController";
import { createClassController } from "../controllers/classController";

const router = express.Router();

// GET all groups (public for frontend)
router.get("/groups", authMiddleware, requireRole("coach"), getGroupsController);

// Create group category
router.post("/groups", authMiddleware, requireRole("coach"), createGroupController);

// Delete a group
router.delete("/groups/:id", authMiddleware, requireRole("coach"), deleteGroupController);

router.get("/groups/:id/students", authMiddleware, requireRole("coach"), getGroupStudentsController);
router.get("/groups/:id/classes", authMiddleware, requireRole("coach"), getGroupClassesController);
router.post("/groups/:groupId/classes", authMiddleware, requireRole("coach"), createClassController);

// Weekly schedule endpoints
router.get("/groups/:id/schedule", authMiddleware, requireRole("coach"), getGroupScheduleController);
router.delete("/groups/:id/schedule-slot", authMiddleware, requireRole("coach"), deleteGroupScheduleSlotController);
router.get("/groups/:id/classes/past", authMiddleware, requireRole("coach"), getGroupPastClassesController);

export default router;
