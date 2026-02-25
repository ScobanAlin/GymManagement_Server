import express from 'express';
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";

import { getGymsController, createGymController, updateGymController, deleteGymController } from '../controllers/gymController';
const router = express();

router.get('/gyms', authMiddleware, requireRole("coach"), getGymsController);
router.post('/gyms', authMiddleware, requireRole("coach"), createGymController);
router.put('/gyms/:id', authMiddleware, requireRole("admin"), updateGymController);
router.delete('/gyms/:id', authMiddleware, requireRole("admin"), deleteGymController);
export default router;
