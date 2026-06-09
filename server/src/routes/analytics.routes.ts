import express from "express";
import { getAnalyticsOverview } from "../controllers/analytics.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";
import authorize from "../middleware/authorize.middleware.ts";

const router = express.Router();

// GET /api/analytics/overview — admin only
router.get("/overview", verifyToken, authorize("admin"), getAnalyticsOverview);

export default router;
