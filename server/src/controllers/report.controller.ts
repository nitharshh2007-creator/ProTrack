import type { Request, Response } from "express";
import { Types } from "mongoose";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";

interface ProjectReportResponse {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  progress: number;
}

interface TaskStatusCounts {
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  inProgressTasks?: number;
  reviewTasks?: number;
  blockedTasks?: number;
}

const emptyTaskCounts: Required<TaskStatusCounts> = {
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  inProgressTasks: 0,
  reviewTasks: 0,
  blockedTasks: 0,
};

export const getProjectReport = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).select("title");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const projectObjectId = new Types.ObjectId(project._id);
    const now = new Date();

    const [taskCounts] = await Task.aggregate<TaskStatusCounts>([
      {
        $match: {
          project: projectObjectId,
        },
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Todo"] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
          },
          reviewTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Review"] }, 1, 0] },
          },
          blockedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Blocked"] }, 1, 0] },
          },
        },
      },
    ]);

    const overdueTasks = await Task.countDocuments({
      project: projectObjectId,
      dueDate: { $lt: now },
      status: { $ne: "Completed" },
    });

    const totalTasks = taskCounts?.totalTasks ?? emptyTaskCounts.totalTasks;
    const completedTasks = taskCounts?.completedTasks ?? emptyTaskCounts.completedTasks;
    const pendingTasks = taskCounts?.pendingTasks ?? emptyTaskCounts.pendingTasks;
    const inProgressTasks = taskCounts?.inProgressTasks ?? emptyTaskCounts.inProgressTasks;
    const reviewTasks = taskCounts?.reviewTasks ?? emptyTaskCounts.reviewTasks;
    const blockedTasks = taskCounts?.blockedTasks ?? emptyTaskCounts.blockedTasks;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const response: ProjectReportResponse = {
      projectId: project._id.toString(),
      projectName: project.title,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      reviewTasks,
      blockedTasks,
      overdueTasks,
      progress,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
