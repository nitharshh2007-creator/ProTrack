import type { Response } from "express";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import type { AuthRequest } from "../types/auth.types.ts";

export const getProjectReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const wsOid = toOid(workspaceId);
    const project = await Project.findOne({
      _id: toOid(req.params.id as string), workspaceId: wsOid,
    }).select("title createdBy members");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (userRole === "admin") {
      // Admins can access reports for any project in their workspace
    } else {
      if (!project.members.some((m) => m.toString() === userId))
        return res.status(403).json({ message: "Access denied" });
    }

    const projectOid = toOid(project._id.toString());
    const now = new Date();

    const [taskCounts] = await Task.aggregate([
      { $match: { project: projectOid, workspaceId: wsOid } },
      {
        $group: {
          _id: null,
          totalTasks:      { $sum: 1 },
          completedTasks:  { $sum: { $cond: [{ $eq: ["$status", "Completed"]  }, 1, 0] } },
          pendingTasks:    { $sum: { $cond: [{ $eq: ["$status", "Todo"]       }, 1, 0] } },
          inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "In Progress"]}, 1, 0] } },
          reviewTasks:     { $sum: { $cond: [{ $eq: ["$status", "Review"]     }, 1, 0] } },
          blockedTasks:    { $sum: { $cond: [{ $eq: ["$status", "Blocked"]    }, 1, 0] } },
        },
      },
    ]);

    const overdueTasks = await Task.countDocuments({
      project: projectOid, workspaceId: wsOid,
      dueDate: { $lt: now }, status: { $ne: "Completed" },
    });

    const total     = taskCounts?.totalTasks     ?? 0;
    const completed = taskCounts?.completedTasks ?? 0;

    return res.status(200).json({
      projectId:       project._id.toString(),
      projectName:     project.title,
      totalTasks:      total,
      completedTasks:  completed,
      pendingTasks:    taskCounts?.pendingTasks    ?? 0,
      inProgressTasks: taskCounts?.inProgressTasks ?? 0,
      reviewTasks:     taskCounts?.reviewTasks     ?? 0,
      blockedTasks:    taskCounts?.blockedTasks     ?? 0,
      overdueTasks,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
    });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};
