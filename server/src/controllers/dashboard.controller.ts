import type { Response } from "express";
import { Types } from "mongoose";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import type { AuthRequest } from "../types/auth.types.ts";

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  activeProjects: number;
  completedProjects: number;
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const uid = toOid(userId);
    const wsOid = toOid(workspaceId);

    let projectFilter: Record<string, unknown>;
    let taskFilter: Record<string, unknown>;

    if (userRole === "admin") {
      projectFilter = { workspaceId: wsOid, createdBy: uid };
      const owned = await Project.find(projectFilter).select("_id");
      const ownedIds = owned.map((p) => p._id);
      taskFilter = { workspaceId: wsOid, project: { $in: ownedIds } };
    } else {
      projectFilter = { workspaceId: wsOid, members: uid };
      taskFilter = {
        workspaceId: wsOid,
        $or: [{ assignedTo: uid }, { createdBy: uid }],
      };
    }

    const [projectStats, taskStats] = await Promise.all([
      Project.aggregate([
        { $match: projectFilter },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
            completedProjects: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          },
        },
      ]),
      Task.aggregate([
        { $match: taskFilter },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
            pendingTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 0, 1] } },
          },
        },
      ]),
    ]);

    const response: DashboardStats = {
      totalProjects: projectStats[0]?.totalProjects ?? 0,
      activeProjects: projectStats[0]?.activeProjects ?? 0,
      completedProjects: projectStats[0]?.completedProjects ?? 0,
      totalTasks: taskStats[0]?.totalTasks ?? 0,
      completedTasks: taskStats[0]?.completedTasks ?? 0,
      pendingTasks: taskStats[0]?.pendingTasks ?? 0,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};
