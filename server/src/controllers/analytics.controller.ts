import type { Request, Response } from "express";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";

interface TaskStatusCount {
  status: string;
  count: number;
}

interface TaskPerProject {
  projectId: string;
  projectTitle: string;
  count: number;
}

export const getAnalyticsOverview = async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    const [
      totalProjects,
      taskStats,
      overdueTasks,
      tasksByStatus,
      tasksByProject,
    ] = await Promise.all([
      // Total projects
      Project.countDocuments(),

      // Task totals via aggregation
      Task.aggregate<{
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
      }>([
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
            pendingTasks: {
              $sum: { $cond: [{ $ne: ["$status", "Completed"] }, 1, 0] },
            },
          },
        },
      ]),

      // Overdue: dueDate < now and not completed
      Task.countDocuments({
        dueDate: { $lt: now },
        status: { $ne: "Completed" },
      }),

      // Tasks grouped by status
      Task.aggregate<TaskStatusCount>([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1,
          },
        },
        { $sort: { status: 1 } },
      ]),

      // Tasks per project (top 10)
      Task.aggregate<TaskPerProject>([
        {
          $group: {
            _id: "$project",
            count: { $sum: 1 },
          },
        },
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

    const totals = taskStats[0] ?? {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
    };

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
    console.error("[getAnalyticsOverview]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
