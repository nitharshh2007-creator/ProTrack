import express from "express";
import { getUsers } from "../controllers/user.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";

const router = express.Router();

// GET /api/users
router.get("/", verifyToken, getUsers);

export default router;
