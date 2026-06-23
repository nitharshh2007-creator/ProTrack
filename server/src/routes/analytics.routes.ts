import express from "express";
import { getAnalyticsData, getProjectsList } from "../controllers/analytics.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";
import authorize from "../middleware/authorize.middleware.ts";

const router = express.Router();

// GET /api/analytics/data — role-based analytics
router.get("/data", verifyToken, getAnalyticsData);

// GET /api/analytics/projects — admin project list for selector
router.get("/projects", verifyToken, authorize("admin", "manager"), getProjectsList);

export default router;
