import express from "express";
import { register, login, profile, me } from "../controllers/authController.ts";
import authMiddleware from "../middleware/auth.middleware.ts";
import authorize from "../middleware/authorize.middleware.ts";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Auth route working" });
});

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);
router.get("/me", authMiddleware, me);
router.get("/admin-test", authMiddleware, authorize("admin"), (req, res) => {
  res.status(200).json({
    message: "Admin access granted",
  });
});

export default router;