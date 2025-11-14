import express from "express";
import {
    getUsersController,
    getUserByEmailController,
    createUserController,
    getCoachesController,
    activateCoachController,
    deleteCoachController,
} from "../controllers/userController";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";

const router = express.Router();

// 🔹 Users
router.get("/users", authMiddleware, requireRole("admin"), getUsersController);
router.get("/users/:email", authMiddleware, requireRole("admin"), getUserByEmailController);
router.post("/users", createUserController);

// 🔹 Coaches
router.get("/coaches", authMiddleware, requireRole("coach"), getCoachesController);
router.put("/coaches/:id/activate", authMiddleware, requireRole("coach"), activateCoachController);
router.delete("/coaches/:id", authMiddleware, requireRole("coach"), deleteCoachController);

export default router;
