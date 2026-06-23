import type { Response } from "express";
import Notification from "../models/Notification.ts";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import User from "../models/User.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import type { AuthRequest } from "../types/auth.types.ts";

type TaskStatus = "Todo" | "In Progress" | "Review" | "Blocked" | "Completed";
type TaskPriority = "Low" | "Medium" | "High";

interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  link?: string;
  projectName?: string;
  taskTitle?: string;
  actorName?: string;
}

interface UpcomingDeadline {
  id: string;
  title: string;
  projectName: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface DashboardStatusCount {
  status: TaskStatus;
  count: number;
}

interface DashboardOverview {
  user: {
    name: string;
    role: string;
  };
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks?: number;
  blockedTasks?: number;
  completionRate: number;
  taskStatusDistribution: DashboardStatusCount[];
  recentActivities: DashboardActivity[];
  upcomingDeadlines: UpcomingDeadline[];
  activeMembers?: number;
  assignedProjects?: any[];
  assignedTasks?: any[];
}

const taskStatuses: TaskStatus[] = ["Todo", "In Progress", "Review", "Blocked", "Completed"];

const toStringId = (value: unknown) => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: { toString: () => string } })._id;
    return id?.toString();
  }
  return value && typeof value === "object" && "toString" in value
    ? (value as { toString: () => string }).toString()
    : undefined;
};

const toName = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  return "name" in value ? String((value as { name?: unknown }).name ?? "") : undefined;
};

const getTitle = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  return "title" in value ? String((value as { title?: unknown }).title ?? "") : undefined;
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Resolve workspace first
    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const uid = toOid(userId);
    const wsOid = toOid(workspaceId);

    const currentUser = await User.findById(userId).select("name role").lean();
    const userName = currentUser?.name ?? req.user?.email ?? "Team member";
    const actualRole = currentUser?.role ?? userRole ?? "employee";

    if (actualRole === "employee" || actualRole === "member") {
      // ── EMPLOYEE DASHBOARD DATA ──
      const assignedProjects = await Project.find({
        workspaceId: wsOid,
        teamMembers: uid,
      })
        .select("title description status deadline endDate members createdBy")
        .populate("createdBy", "name")
        .populate("members", "name")
        .lean();

      const assignedTasks = await Task.find({
        workspaceId: wsOid,
        assignedTo: uid,
      })
        .select("title status priority dueDate project")
        .populate("project", "title")
        .lean();

      const projectIds = assignedProjects.map((p) => p._id);
      const progressByProject = new Map<string, number>();

      if (projectIds.length > 0) {
        const progressAgg = await Task.aggregate([
          { $match: { project: { $in: projectIds }, workspaceId: wsOid } },
          {
            $group: {
              _id: "$project",
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
            },
          },
        ]);

        for (const row of progressAgg) {
          const total = row.total ?? 0;
          const completed = row.completed ?? 0;
          progressByProject.set(
            String(row._id),
            total === 0 ? 0 : Math.round((completed / total) * 100),
          );
        }
      }

      const totalTasks = assignedTasks.length;
      const completedTasks = assignedTasks.filter((t) => t.status === "Completed").length;
      const pendingTasks = totalTasks - completedTasks;
      const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      // Upcoming deadlines (tasks assigned to employee, incomplete only)
      const upcomingTasks = await Task.find({
        workspaceId: wsOid,
        assignedTo: uid,
        status: { $ne: "Completed" },
        dueDate: { $exists: true },
      })
        .select("title dueDate priority status project")
        .sort({ dueDate: 1 })
        .limit(6)
        .populate("project", "title")
        .lean();

      const upcomingDeadlines = upcomingTasks.map((task) => ({
        id: String(task._id),
        title: String(task.title ?? ""),
        projectName: getTitle(task.project) ?? "Untitled project",
        dueDate: new Date(String(task.dueDate)).toISOString(),
        priority: task.priority as TaskPriority,
        status: task.status as TaskStatus,
      }));

      // Employee activity: Only notifications related to their tasks/projects
      const assignedProjectIds = assignedProjects.map((p) => p._id);
      const assignedTaskIds = assignedTasks.map((t) => t._id);
      
      const employeeActivityTypes = [
        "task_assigned",
        "task_reassigned",
        "task_created",
        "task_completed",
        "task_updated",
        "comment_added",
        "reply_added",
        "project_updated",
        "file_uploaded",
        "video_uploaded",
        "audio_uploaded",
        "deadline_reminder",
        "task_overdue",
      ] as const;

      const notifications = await Notification.find({
        type: { $in: employeeActivityTypes },
        $or: [
          { relatedProjectId: { $in: assignedProjectIds } },
          { relatedTaskId: { $in: assignedTaskIds } },
          { userId: uid },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("triggeredBy", "name")
        .populate("relatedProjectId", "title")
        .populate("relatedTaskId", "title")
        .lean();

      const seen = new Set<string>();
      const recentActivities: DashboardActivity[] = [];

      for (const notification of notifications as Array<Record<string, any>>) {
        const signature = [
          notification.type,
          toStringId(notification.relatedProjectId),
          toStringId(notification.relatedTaskId),
          toStringId(notification.triggeredBy),
          notification.message,
        ].join("|");

        if (seen.has(signature)) continue;
        seen.add(signature);

        recentActivities.push({
          id: toStringId(notification._id) ?? signature,
          type: String(notification.type ?? ""),
          title: String(notification.title ?? ""),
          message: String(notification.message ?? ""),
          createdAt: notification.createdAt instanceof Date
            ? notification.createdAt.toISOString()
            : new Date(String(notification.createdAt ?? Date.now())).toISOString(),
          link: typeof notification.link === "string" ? notification.link : undefined,
          projectName: getTitle(notification.relatedProjectId),
          taskTitle: getTitle(notification.relatedTaskId),
          actorName: toName(notification.triggeredBy),
        });

        if (recentActivities.length >= 10) break;
      }

      return res.status(200).json({
        user: {
          name: userName,
          role: actualRole,
        },
        assignedProjectCount: assignedProjects.length,
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
        assignedProjects: assignedProjects.map((p) => {
          const dueDate = p.deadline ?? p.endDate;
          return {
            _id: String(p._id),
            title: String(p.title ?? ""),
            description: String(p.description ?? ""),
            status: String(p.status ?? "Planning"),
            progress: progressByProject.get(String(p._id)) ?? 0,
            dueDate: dueDate ? new Date(String(dueDate)).toISOString() : null,
          };
        }),
        assignedTasks: assignedTasks.map((t) => ({
          _id: String(t._id),
          title: String(t.title ?? ""),
          status: String(t.status ?? "Todo"),
          priority: String(t.priority ?? "Medium"),
          dueDate: t.dueDate ? new Date(String(t.dueDate)).toISOString() : null,
          projectName: getTitle(t.project) ?? "Untitled project",
        })),
        upcomingDeadlines,
        recentActivities,
      });
    }

    // ── ADMIN & MANAGER DASHBOARD DATA ──
    const projectFilter = { workspaceId: wsOid };
    const taskFilter = { workspaceId: wsOid };

    const [projectStats, taskStats, upcomingTasks, workspaceUsers] = await Promise.all([
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
            todoTasks: { $sum: { $cond: [{ $eq: ["$status", "Todo"] }, 1, 0] } },
            inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
            reviewTasks: { $sum: { $cond: [{ $eq: ["$status", "Review"] }, 1, 0] } },
            blockedTasks: { $sum: { $cond: [{ $eq: ["$status", "Blocked"] }, 1, 0] } },
            completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
            overdueTasks: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$status", "Completed"] },
                      { $lt: ["$dueDate", new Date()] },
                      { $ne: ["$dueDate", null] }
                    ]
                  }, 1, 0
                ]
              }
            },
          },
        },
      ]),
      Task.find({ ...taskFilter, status: { $ne: "Completed" }, dueDate: { $exists: true } })
        .select("title dueDate priority status project")
        .sort({ dueDate: 1 })
        .limit(6)
        .populate("project", "title")
        .lean(),
      User.find({ workspaceId: wsOid }).select("_id name").lean(),
    ]);

    const projectSummary = projectStats[0] ?? { totalProjects: 0, activeProjects: 0, completedProjects: 0 };
    const taskSummary = taskStats[0] ?? {
      totalTasks: 0,
      todoTasks: 0,
      inProgressTasks: 0,
      reviewTasks: 0,
      blockedTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
    };

    const completionRate = taskSummary.totalTasks === 0
      ? 0
      : Math.round((taskSummary.completedTasks / taskSummary.totalTasks) * 100);

    const statusMap: Record<TaskStatus, number> = {
      Todo: taskSummary.todoTasks ?? 0,
      "In Progress": taskSummary.inProgressTasks ?? 0,
      Review: taskSummary.reviewTasks ?? 0,
      Blocked: taskSummary.blockedTasks ?? 0,
      Completed: taskSummary.completedTasks ?? 0,
    };

    // Workspace activity: All notifications in workspace
    const notifications = await Notification.find({ workspaceId: wsOid })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("triggeredBy", "name")
      .populate("relatedProjectId", "title")
      .populate("relatedTaskId", "title")
      .lean();

    const seen = new Set<string>();
    const recentActivities: DashboardActivity[] = [];

    for (const notification of notifications as Array<Record<string, unknown>>) {
      const signature = [
        notification.type,
        toStringId(notification.relatedProjectId),
        toStringId(notification.relatedTaskId),
        toStringId(notification.triggeredBy),
        notification.message,
      ].join("|");

      if (seen.has(signature)) continue;
      seen.add(signature);

      recentActivities.push({
        id: toStringId(notification._id) ?? signature,
        type: String(notification.type ?? ""),
        title: String(notification.title ?? ""),
        message: String(notification.message ?? ""),
        createdAt: notification.createdAt instanceof Date
          ? notification.createdAt.toISOString()
          : new Date(String(notification.createdAt ?? Date.now())).toISOString(),
        link: typeof notification.link === "string" ? notification.link : undefined,
        projectName: getTitle(notification.relatedProjectId),
        taskTitle: getTitle(notification.relatedTaskId),
        actorName: toName(notification.triggeredBy),
      });

      if (recentActivities.length >= 10) break;
    }

    const upcomingDeadlines: UpcomingDeadline[] = upcomingTasks.map((task) => ({
      id: String(task._id),
      title: String(task.title ?? ""),
      projectName: getTitle(task.project) ?? "Untitled project",
      dueDate: new Date(String(task.dueDate)).toISOString(),
      priority: task.priority as TaskPriority,
      status: task.status as TaskStatus,
    }));

    return res.status(200).json({
      user: {
        name: userName,
        role: actualRole,
      },
      totalProjects: projectSummary.totalProjects ?? 0,
      activeProjects: projectSummary.activeProjects ?? 0,
      completedProjects: projectSummary.completedProjects ?? 0,
      totalTasks: taskSummary.totalTasks ?? 0,
      completedTasks: taskSummary.completedTasks ?? 0,
      pendingTasks: Math.max(0, (taskSummary.totalTasks ?? 0) - (taskSummary.completedTasks ?? 0)),
      overdueTasks: taskSummary.overdueTasks ?? 0,
      blockedTasks: taskSummary.blockedTasks ?? 0,
      completionRate,
      taskStatusDistribution: taskStatuses.map((status) => ({
        status,
        count: statusMap[status] ?? 0,
      })),
      recentActivities,
      upcomingDeadlines,
      activeMembers: workspaceUsers.length,
    });
  } catch (error) {
    console.error("[getDashboardStats]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
