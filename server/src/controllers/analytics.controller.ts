import type { Response } from "express";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import type { AuthRequest } from "../types/auth.types.ts";

interface TaskStatusCount { status: string; count: number; }
interface TaskPerProject { projectId: string; projectTitle: string; count: number; }

export const getAnalyticsOverview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const wsOid = toOid(workspaceId);

    const ownedProjects = await Project.find({
      createdBy: toOid(userId),
      workspaceId: wsOid,
    }).select("_id");
    const ownedProjectIds = ownedProjects.map((p) => p._id);

    const now = new Date();
    const taskMatch = { project: { $in: ownedProjectIds }, workspaceId: wsOid };

    const [totalProjects, taskStats, overdueTasks, tasksByStatus, tasksByProject] =
      await Promise.all([
        Promise.resolve(ownedProjectIds.length),

        Task.aggregate<{ totalTasks: number; completedTasks: number; pendingTasks: number }>([
          { $match: taskMatch },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
              pendingTasks: { $sum: { $cond: [{ $ne: ["$status", "Completed"] }, 1, 0] } },
            },
          },
        ]),

        Task.countDocuments({
          ...taskMatch,
          dueDate: { $lt: now },
          status: { $ne: "Completed" },
        }),

        Task.aggregate<TaskStatusCount>([
          { $match: taskMatch },
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
          { $sort: { status: 1 } },
        ]),

        Task.aggregate<TaskPerProject>([
          { $match: taskMatch },
          { $group: { _id: "$project", count: { $sum: 1 } } },
          {
            $lookup: {
              from: "projects",
              localField: "_id",
              foreignField: "_id",
              as: "project",
            },
          },
          { $unwind: { path: "$project", preserveNullAndEmptyArrays: false } },
          {
            $project: {
              _id: 0,
              projectId: { $toString: "$_id" },
              projectTitle: "$project.title",
              count: 1,
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

    const totals = taskStats[0] ?? { totalTasks: 0, completedTasks: 0, pendingTasks: 0 };
    const completionPercentage =
      totals.totalTasks === 0
        ? 0
        : Math.round((totals.completedTasks / totals.totalTasks) * 100);

    return res.status(200).json({
      totalProjects,
      totalTasks: totals.totalTasks,
      completedTasks: totals.completedTasks,
      pendingTasks: totals.pendingTasks,
      overdueTasks,
      completionPercentage,
      tasksByStatus,
      tasksByProject,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};
