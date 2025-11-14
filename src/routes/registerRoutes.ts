import express from "express";

import { register } from "../controllers/registerController";

const router = express();

router.post("/register", register);

export default router;