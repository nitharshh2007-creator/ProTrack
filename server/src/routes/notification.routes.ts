import express from "express";
import {
  deleteNotification,
  getNotificationSummary,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.get("/summary", verifyToken, getNotificationSummary);
router.patch("/read-all", verifyToken, markAllNotificationsRead);
router.patch("/:id/read", verifyToken, markNotificationRead);
router.delete("/:id", verifyToken, deleteNotification);

export default router;
