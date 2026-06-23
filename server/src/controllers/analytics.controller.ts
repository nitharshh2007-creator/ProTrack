import type { Response } from "express";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import User from "../models/User.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import type { AuthRequest } from "../types/auth.types.ts";

interface TaskStatusCount { status: string; count: number; }
interface TaskPriorityCount { priority: string; count: number; }
interface WorkloadItem { employeeId: string; employeeName: string; taskCount: number; }
interface ActivityItem { type: string; description: string; timestamp: Date; }

export const getAnalyticsData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const uid = toOid(userId);
    const wsOid = toOid(workspaceId);
    const currentUser = await User.findById(userId).select("role").lean();
    const userRole = currentUser?.role ?? "employee";
    const { projectId } = req.query;

    if (userRole === "employee") {
      const assignedProjects = await Project.find({
        workspaceId: wsOid,
        teamMembers: uid,
      }).select("_id title status deadline").lean();

      const assignedProjectIds = assignedProjects.map((p) => p._id);
      const taskMatch = {
        project: { $in: assignedProjectIds },
        assignedTo: uid,
        workspaceId: wsOid,
      };

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [taskStats, statusDist, completionTrend, deadlines] = await Promise.all([
        Task.aggregate<{ totalTasks: number; completedTasks: number }>([
          { $match: taskMatch },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
            },
          },
        ]),

        Task.aggregate<TaskStatusCount>([
          { $match: taskMatch },
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
        ]),

        Task.aggregate<{ date: string; count: number }>([
          { $match: { ...taskMatch, status: "Completed", updatedAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: "$_id", count: 1 } },
        ]),

        Task.find({ ...taskMatch, dueDate: { $gte: now } })
          .select("title dueDate status")
          .sort({ dueDate: 1 })
          .limit(10)
          .lean(),
      ]);

      const totals = taskStats[0] ?? { totalTasks: 0, completedTasks: 0 };
      const completionRate =
        totals.totalTasks === 0 ? 0 : Math.round((totals.completedTasks / totals.totalTasks) * 100);

      return res.status(200).json({
        role: "employee",
        assignedProjects: assignedProjects.length,
        assignedTasks: totals.totalTasks,
        completedTasks: totals.completedTasks,
        completionRate,
        personalStatusDistribution: statusDist,
        completionTrend,
        deadlines,
      });
    }

    // Admin/Manager Analytics
    let projectMatch: any = { workspaceId: wsOid };
    let taskMatch: any = { workspaceId: wsOid };

    if (projectId && projectId !== "all") {
      const projectOid = toOid(projectId as string);
      projectMatch = { _id: projectOid, workspaceId: wsOid };
      taskMatch = { project: projectOid, workspaceId: wsOid };
    } else {
      const allProjects = await Project.find({ workspaceId: wsOid }).select("_id").lean();
      const allProjectIds = allProjects.map((p) => p._id);
      taskMatch = { project: { $in: allProjectIds }, workspaceId: wsOid };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      taskStats,
      statusDist,
      priorityDist,
      workload,
      completionTrend,
      recentActivity,
      upcomingDeadlines,
      projectProgress,
    ] = await Promise.all([
      Project.countDocuments(projectMatch),

      Project.countDocuments({ ...projectMatch, status: "Active" }),

      Project.countDocuments({ ...projectMatch, status: "Completed" }),

      Task.aggregate<{ totalTasks: number; completedTasks: number }>([
        { $match: taskMatch },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          },
        },
      ]),

      Task.aggregate<TaskStatusCount>([
        { $match: taskMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),

      Task.aggregate<TaskPriorityCount>([
        { $match: taskMatch },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $project: { _id: 0, priority: "$_id", count: 1 } },
      ]),

      Task.aggregate<WorkloadItem>([
        { $match: taskMatch },
        {
          $group: {
            _id: "$assignedTo",
            taskCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            employeeId: { $toString: "$_id" },
            employeeName: { $ifNull: ["$employee.name", "Unassigned"] },
            taskCount: 1,
          },
        },
        { $sort: { taskCount: -1 } },
        { $limit: 10 },
      ]),

      Task.aggregate<{ date: string; count: number }>([
        { $match: { ...taskMatch, status: "Completed", updatedAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),

      Task.aggregate<ActivityItem>([
        { $match: { ...taskMatch, updatedAt: { $gte: thirtyDaysAgo } } },
        {
          $project: {
            type: { $literal: "Task Update" },
            description: "$title",
            timestamp: "$updatedAt",
          },
        },
        { $limit: 20 },
        { $sort: { timestamp: -1 } },
      ]),

      Task.find({ ...taskMatch, dueDate: { $gte: now } })
        .select("title dueDate status")
        .sort({ dueDate: 1 })
        .limit(10)
        .lean(),

      Task.aggregate<{ projectId: string; projectTitle: string; completed: number; total: number }>([
        { $match: taskMatch },
        {
          $group: {
            _id: "$project",
            completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
            total: { $sum: 1 },
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
            completed: 1,
            total: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const totals = taskStats[0] ?? { totalTasks: 0, completedTasks: 0 };
    const completionRate =
      totals.totalTasks === 0 ? 0 : Math.round((totals.completedTasks / totals.totalTasks) * 100);

    const projectProgressData = projectProgress.map((p) => ({
      projectName: p.projectTitle,
      completionPercent: p.total === 0 ? 0 : Math.round((p.completed / p.total) * 100),
    }));

    return res.status(200).json({
      role: "admin",
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks: totals.totalTasks,
      completedTasks: totals.completedTasks,
      completionRate,
      statusDistribution: statusDist,
      priorityDistribution: priorityDist,
      workloadDistribution: workload,
      projectProgressComparison: projectProgressData,
      completionTrend,
      recentActivity,
      upcomingDeadlines,
    });
  } catch (error) {
    console.error("[getAnalyticsData]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getProjectsList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const wsOid = toOid(workspaceId);
    const projects = await Project.find({ workspaceId: wsOid })
      .select("title status")
      .sort({ title: 1 })
      .lean();

    return res.status(200).json({
      projects: projects.map((p) => ({
        _id: String(p._id),
        title: String(p.title ?? "Untitled"),
        status: String(p.status ?? "Active"),
      })),
    });
  } catch (error) {
    console.error("[getProjectsList]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
