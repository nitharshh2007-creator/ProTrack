import type { Response } from "express";
import { Types } from "mongoose";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import type { AuthRequest } from "../types/auth.types.ts";

type ProjectStatus = "Planning" | "Active" | "Completed" | "Archived";
type ProjectPriority = "Low" | "Medium" | "High";
type KanbanStatus = "Todo" | "In Progress" | "Review" | "Blocked" | "Completed";

interface KanbanBoard {
  Todo: unknown[];
  "In Progress": unknown[];
  Review: unknown[];
  Blocked: unknown[];
  Completed: unknown[];
}

interface CreateProjectBody {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  deadline?: string;
  members?: string[];
}

interface UpdateProjectBody {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  deadline?: string | null;
  members?: string[];
}

const toObjectIds = (values: string[] = []) => values.map((v) => new Types.ObjectId(v));

const ownsProject = (createdBy: Types.ObjectId, userId: string) =>
  createdBy.toString() === userId;

const isMember = (members: Types.ObjectId[], userId: string) =>
  members.some((m) => m.toString() === userId);

const canAccessProject = (project: any, userId: string, userRole: string) => {
  console.log("[Project Access Check]", {
    userId,
    userRole,
    projectId: project._id,
    projectOwner: project.createdBy?.toString?.() || project.createdBy,
    projectWorkspace: project.workspaceId?.toString?.() || project.workspaceId,
    projectMembers: project.members?.map((m: any) => m.toString?.() || m),
  });

  if (userRole === "admin") {
    // Admins can access any project in their workspace
    return true;
  } else {
    // Non-admins can only access projects they're members of
    return isMember(project.members as unknown as Types.ObjectId[], userId);
  }
};

const emptyBoard = (): KanbanBoard => ({
  Todo: [], "In Progress": [], Review: [], Blocked: [], Completed: [],
});

// ── createProject ─────────────────────────────────────────────────────────────

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const { title, description, status, priority, deadline, members } =
      req.body as CreateProjectBody;
    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required" });

    const project = await Project.create({
      title, description,
      ...(status   !== undefined ? { status }   : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(deadline !== undefined ? { deadline } : {}),
      createdBy: toOid(userId),
      members: toObjectIds(members),
      workspaceId: toOid(workspaceId),
    });

    const populated = await project.populate([
      { path: "createdBy", select: "name email role" },
      { path: "members",   select: "name email role" },
    ]);

    return res.status(201).json({ message: "Project created successfully", project: populated });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── getProjects ───────────────────────────────────────────────────────────────

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    console.log("[getProjects]", { userId, userRole, workspaceId });

    const wsOid = toOid(workspaceId);
    const filter =
      userRole === "admin"
        ? { workspaceId: wsOid } // Admins see ALL projects in their workspace
        : { workspaceId: wsOid, members: toOid(userId) }; // Non-admins see only projects they're members of

    const projects = await Project.find(filter)
      .populate("createdBy", "name email role")
      .populate("members",   "name email role");

    console.log("[getProjects] Found", projects.length, "projects");
    return res.status(200).json({ projects });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── getProjectById ────────────────────────────────────────────────────────────

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const project = await Project.findOne({
      _id: req.params.id,
      workspaceId: toOid(workspaceId),
    })
      .populate("createdBy", "name email role")
      .populate("members",   "name email role");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canAccessProject(project, userId, userRole)) {
      console.log("[getProjectById] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ project });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── getProjectProgress ────────────────────────────────────────────────────────

export const getProjectProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const wsOid = toOid(workspaceId);
    const project = await Project.findOne({
      _id: req.params.id, workspaceId: wsOid,
    }).select("title createdBy members")
      .populate("createdBy", "name")
      .populate("members", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canAccessProject(project, userId, userRole)) {
      console.log("[getProjectProgress] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ project: project._id, workspaceId: wsOid }),
      Task.countDocuments({ project: project._id, workspaceId: wsOid, status: "Completed" }),
    ]);

    return res.status(200).json({
      projectId:    project._id,
      projectName:  project.title,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      progress:     totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── getProjectKanban ──────────────────────────────────────────────────────────

export const getProjectKanban = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const wsOid = toOid(workspaceId);
    const project = await Project.findOne({
      _id: req.params.id, workspaceId: wsOid,
    }).select("title createdBy members")
      .populate("createdBy", "name")
      .populate("members", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canAccessProject(project, userId, userRole)) {
      console.log("[getProjectKanban] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    const taskFilter: Record<string, unknown> = { project: project._id, workspaceId: wsOid };
    if (userRole !== "admin") taskFilter.assignedTo = toOid(userId);

    const tasks = await Task.find(taskFilter)
      .populate("assignedTo", "name email")
      .populate("createdBy",  "name email")
      .sort({ createdAt: -1 });

    const board = emptyBoard();
    for (const task of tasks) {
      const col = task.status as KanbanStatus;
      if (col in board) {
        (board[col] as unknown[]).push({
          _id: task._id, title: task.title, status: col,
          assignedTo: task.assignedTo, createdBy: task.createdBy,
        });
      }
    }

    return res.status(200).json(board);
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── getProjectTimeline ────────────────────────────────────────────────────────

export const getProjectTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const wsOid = toOid(workspaceId);
    const project = await Project.findOne({
      _id: req.params.id, workspaceId: wsOid,
    }).select("title description status priority createdBy members")
      .populate("createdBy", "name")
      .populate("members", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canAccessProject(project, userId, userRole)) {
      console.log("[getProjectTimeline] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    const taskFilter: Record<string, unknown> = { project: project._id, workspaceId: wsOid };
    if (userRole !== "admin") taskFilter.assignedTo = toOid(userId);

    const [tasks, progressAgg] = await Promise.all([
      Task.find(taskFilter)
        .select("title description status priority startDate dueDate assignedTo createdAt")
        .populate("assignedTo", "name email")
        .sort({ startDate: 1, dueDate: 1, createdAt: 1 })
        .lean(),
      Task.aggregate<{ total: number; completed: number }>([
        { $match: taskFilter },
        { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } } } },
      ]),
    ]);

    const totals = progressAgg[0] ?? { total: 0, completed: 0 };
    const progressPct = totals.total === 0 ? 0 : Math.round((totals.completed / totals.total) * 100);

    const pct = (s: KanbanStatus) =>
      s === "Completed" ? 100 : s === "Review" ? 75 : s === "In Progress" ? 50 : s === "Blocked" ? 25 : 0;

    const timeline = tasks.map((t) => {
      const start = t.startDate ?? t.createdAt;
      const end   = t.dueDate ?? new Date(new Date(start).getTime() + 86_400_000);
      return {
        id: t._id.toString(), name: t.title, description: t.description,
        status: t.status, priority: t.priority,
        start: new Date(start).toISOString(), end: new Date(end).toISOString(),
        progress: pct(t.status as KanbanStatus), assignedTo: t.assignedTo,
      };
    });

    return res.status(200).json({
      project: {
        id: project._id.toString(), title: project.title,
        description: project.description, status: project.status,
        priority: project.priority, progress: progressPct,
      },
      tasks: timeline,
    });
  } catch (err) {
    console.error("[getProjectTimeline]", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── updateProject ─────────────────────────────────────────────────────────────

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const { title, description, status, priority, deadline, members } =
      req.body as UpdateProjectBody;

    const project = await Project.findOne({
      _id: req.params.id, workspaceId: toOid(workspaceId),
    })
      .populate("createdBy", "name")
      .populate("members", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });
    
    if (!canAccessProject(project, userId, userRole)) {
      console.log("[updateProject] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    if (title       !== undefined) project.title       = title;
    if (description !== undefined) project.description = description;
    if (status      !== undefined) project.status      = status;
    if (priority    !== undefined) project.priority    = priority;
    if (deadline    !== undefined) {
      if (deadline) project.deadline = new Date(deadline);
      else project.set("deadline", undefined);
    }
    if (members !== undefined) project.members = toObjectIds(members);

    await project.save();
    const populated = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members",   "name email role");

    return res.status(200).json({ message: "Project updated successfully", project: populated });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── deleteProject ─────────────────────────────────────────────────────────────

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const project = await Project.findOne({
      _id: req.params.id, workspaceId: toOid(workspaceId),
    })
      .populate("createdBy", "name")
      .populate("members", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });
    
    if (!canAccessProject(project, userId, userRole)) {
      console.log("[deleteProject] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    await project.deleteOne();
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── uploadCoverImage ──────────────────────────────────────────────────────────

export const uploadCoverImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const project = await Project.findOne({
      _id: req.params.id, workspaceId: toOid(workspaceId),
    }).populate("createdBy", "name").populate("members", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });
    
    if (!canAccessProject(project, userId, userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const imageData = req.body?.image; // expects base64 data URI
    if (!imageData) return res.status(400).json({ message: "Image data required" });

    project.coverImage = imageData;
    await project.save();

    return res.status(200).json({ message: "Cover image updated", project });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};
