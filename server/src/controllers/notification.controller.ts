import type { Response } from "express";
import { Types } from "mongoose";
import Notification from "../models/Notification.ts";
import type { AuthRequest } from "../types/auth.types.ts";
import { emitNotificationDeleted, emitNotificationUpdated } from "../realtime/socket.ts";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notifications = await Notification.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("[getNotifications]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getNotificationSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [total, unread] = await Promise.all([
      Notification.countDocuments({ userId: new Types.ObjectId(userId) }),
      Notification.countDocuments({ userId: new Types.ObjectId(userId), isRead: false }),
    ]);

    return res.status(200).json({ total, unread });
  } catch (error) {
    console.error("[getNotificationSummary]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notificationId = req.params.id as string;
    await Notification.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } }
    );
    const notification = await Notification.findById(notificationId);

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    emitNotificationUpdated(notification);
    return res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("[markNotificationRead]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const unreadNotifications = await Notification.find({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });

    await Notification.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );

    unreadNotifications.forEach((notification) => {
      emitNotificationUpdated({ ...notification.toObject(), isRead: true } as typeof notification);
    });

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("[markAllNotificationsRead]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notificationId = req.params.id as string;
    const notification = await Notification.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    emitNotificationDeleted(notification);
    return res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("[deleteNotification]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
