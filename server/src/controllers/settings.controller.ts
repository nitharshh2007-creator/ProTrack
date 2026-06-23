import type { Request } from "express";
import type { Response } from "express";
import User from "../models/User.ts";

export const getSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      theme: user.theme || "light",
      density: user.density || "comfortable",
      notifications: user.notifications || {
        email: true,
        projectUpdates: true,
        taskReminders: true,
        teamInvites: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch settings",
    });
  }
};

export const updateSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.userId;
    const { theme, density, notifications } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { theme, density, notifications },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      success: true,
      settings: {
        theme: user.theme,
        density: user.density,
        notifications: user.notifications,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update settings",
    });
  }
};