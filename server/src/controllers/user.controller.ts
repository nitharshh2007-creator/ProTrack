import type { Response } from "express";
import User from "../models/User.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import type { AuthRequest } from "../types/auth.types.ts";

// GET /api/users — returns all users in the same workspace
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const users = await User.find({
      workspaceId: toOid(workspaceId),
    }).select("_id name email role");

    return res.status(200).json({ users });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};
