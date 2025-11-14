import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import {
    getGroupsController,
    createGroupController,
    deleteGroupController,
    getGroupClassesController,
    getGroupStudentsController
} from "../controllers/groupController";

const router = express.Router();

// GET all groups (public for frontend)
router.get("/groups", authMiddleware, requireRole("coach"), getGroupsController);

// Create group category
router.post("/groups", authMiddleware, requireRole("coach"), createGroupController);

// Delete a group
router.delete("/groups/:id", authMiddleware, requireRole("coach"), deleteGroupController);


router.get("/groups/:id/students", authMiddleware, requireRole("coach"), getGroupStudentsController);
router.get("/groups/:id/classes", authMiddleware, requireRole("coach"), getGroupClassesController);

export default router;
