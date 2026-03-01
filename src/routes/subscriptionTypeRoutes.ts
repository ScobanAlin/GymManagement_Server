import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";
import {
    getAllSubscriptionTypesController,
    createSubscriptionTypeController,
    updateSubscriptionTypeController,
    deleteSubscriptionTypeController,
} from "../controllers/subscriptionTypeController";

const router = express.Router();

router.get("/subscription-types", authMiddleware, requireRole("coach"), getAllSubscriptionTypesController);
router.post("/subscription-types", authMiddleware, requireRole("admin"), createSubscriptionTypeController);
router.put("/subscription-types/:id", authMiddleware, requireRole("admin"), updateSubscriptionTypeController);
router.delete("/subscription-types/:id", authMiddleware, requireRole("admin"), deleteSubscriptionTypeController);

export default router;
