import express from "express";
import { getProjectReport } from "../controllers/report.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";

const router = express.Router();

router.get("/project/:id", verifyToken, getProjectReport);

export default router;
