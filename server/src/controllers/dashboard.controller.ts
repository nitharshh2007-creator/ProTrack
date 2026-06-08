import type { Request, Response } from "express";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  activeProjects: number;
  completedProjects: number;
}

interface ProjectStatsAggregate {
  totalProjects?: number;
  activeProjects?: number;
  completedProjects?: number;
}

interface TaskStatsAggregate {
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
}

const defaultDashboardStats: DashboardStats = {
  totalProjects: 0,
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  activeProjects: 0,
  completedProjects: 0,
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [projectStats, taskStats] = await Promise.all([
      Project.aggregate<ProjectStatsAggregate>([
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: {
              $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
            },
            completedProjects: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
          },
        },
      ]),
      Task.aggregate<TaskStatsAggregate>([
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
            pendingTasks: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 0, 1] },
            },
          },
        },
      ]),
    ]);

    const response: DashboardStats = {
      ...defaultDashboardStats,
      totalProjects: projectStats[0]?.totalProjects ?? 0,
      activeProjects: projectStats[0]?.activeProjects ?? 0,
      completedProjects: projectStats[0]?.completedProjects ?? 0,
      totalTasks: taskStats[0]?.totalTasks ?? 0,
      completedTasks: taskStats[0]?.completedTasks ?? 0,
      pendingTasks: taskStats[0]?.pendingTasks ?? 0,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
