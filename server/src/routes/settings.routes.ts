import express from "express";
import verifyToken from "../middleware/auth.middleware.ts";
import {
  getSettings,
  updateSettings,
} from "../controllers/settings.controller.ts";

const router = express.Router();

router.get("/", verifyToken, getSettings);
router.put("/", verifyToken, updateSettings);

export default router;