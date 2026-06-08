import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";

const router = express.Router();

router.get("/stats", verifyToken, getDashboardStats);

export default router;
