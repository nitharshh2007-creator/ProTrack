import type { Response } from "express";
import { Types } from "mongoose";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import {
  buildProjectLink,
  createNotificationsForUsers,
} from "../services/notification.service.ts";
import { emitDashboardRefresh } from "../realtime/socket.ts";
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
  coverImage?: string;
  members?: string[];
  teamMembers?: string[];
}

interface UpdateProjectBody {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  deadline?: string | null;
  coverImage?: string | null;
  members?: string[];
  teamMembers?: string[];
}

const toObjectIds = (values: string[] = []) => values.map((v) => new Types.ObjectId(v));

const ownsProject = (createdBy: Types.ObjectId, userId: string) =>
  createdBy.toString() === userId;

const isMember = (members: any[], userId: string) =>
  members.some((m) => (m._id ?? m).toString() === userId);

const canAccessProject = (project: any, userId: string, userRole?: string) => {
  console.log("[Project Access Check]", {
    userId,
    userRole,
    projectId: project._id,
    projectOwner: project.createdBy?.toString?.() || project.createdBy,
    projectWorkspace: project.workspaceId?.toString?.() || project.workspaceId,
    projectMembers: project.members?.map((m: any) => m.toString?.() || m),
    projectTeamMembers: project.teamMembers?.map((m: any) => m.toString?.() || m),
  });

  if (userRole === "admin") {
    // Admins can access any project in their workspace
    return true;
  } else {
    // Non-admins can only access projects they're members of
    const isMem = isMember(project.members as unknown as Types.ObjectId[], userId);
    const isTeamMem = isMember((project.teamMembers || []) as unknown as Types.ObjectId[], userId);
    return isMem || isTeamMem;
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

    const { title, description, status, priority, deadline, coverImage, members, teamMembers } =
      req.body as CreateProjectBody;
    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required" });

    const project = await Project.create({
      title, description,
      ...(status   !== undefined ? { status }   : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(deadline !== undefined ? { deadline } : {}),
      ...(coverImage !== undefined ? { coverImage } : {}),
      createdBy: toOid(userId),
      members: toObjectIds(members),
      teamMembers: toObjectIds(teamMembers),
      workspaceId: toOid(workspaceId),
    });

    const populated = await project.populate([
      { path: "createdBy", select: "name email role" },
      { path: "members",   select: "name email role" },
      { path: "teamMembers", select: "name email role" },
    ]);

    emitDashboardRefresh(workspaceId);

    await createNotificationsForUsers(
      (teamMembers ?? []).filter((memberId) => memberId !== userId),
      {
        type: "project_created",
        title: "Project Created",
        message: `You have been assigned to project ${title}.`,
        relatedProjectId: project._id.toString(),
        triggeredBy: userId,
        link: buildProjectLink(project._id.toString()),
      }
    );

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
        : { workspaceId: wsOid, teamMembers: toOid(userId) }; // Non-admins see only projects where employee is assigned!

    const projects = await Project.find(filter)
      .populate("createdBy", "name email role")
      .populate("members",   "name email role")
      .populate("teamMembers", "name email role");

    // Attach task counts to each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const [totalTasks, completedTasks, inProgressTasks] = await Promise.all([
          Task.countDocuments({ project: p._id, workspaceId: wsOid }),
          Task.countDocuments({ project: p._id, workspaceId: wsOid, status: "Completed" }),
          Task.countDocuments({ project: p._id, workspaceId: wsOid, status: "In Progress" }),
        ]);
        return { ...p.toObject(), totalTasks, completedTasks, inProgressTasks };
      })
    );

    console.log("[getProjects] Found", projects.length, "projects");
    return res.status(200).json({ projects: projectsWithCounts });
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
      _id: toOid(req.params.id as string),
      workspaceId: toOid(workspaceId),
    })
      .populate("createdBy", "name email role")
      .populate("members",   "name email role")
      .populate("teamMembers", "name email role");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canAccessProject(project, userId, userRole)) {
      console.log("[getProjectById] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    const wsOid2 = toOid(workspaceId);
    const [totalTasks, completedTasks, inProgressTasks] = await Promise.all([
      Task.countDocuments({ project: project._id, workspaceId: wsOid2 }),
      Task.countDocuments({ project: project._id, workspaceId: wsOid2, status: "Completed" }),
      Task.countDocuments({ project: project._id, workspaceId: wsOid2, status: "In Progress" }),
    ]);

    const projectWithCounts = { ...project.toObject(), totalTasks, completedTasks, inProgressTasks };
    return res.status(200).json({ project: projectWithCounts });
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
      _id: toOid(req.params.id as string), workspaceId: wsOid,
    }).select("title createdBy members teamMembers")
      .populate("createdBy", "name")
      .populate("members", "name")
      .populate("teamMembers", "name");

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
      _id: toOid(req.params.id as string), workspaceId: wsOid,
    }).select("title createdBy members teamMembers")
      .populate("createdBy", "name")
      .populate("members", "name")
      .populate("teamMembers", "name");

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
      _id: toOid(req.params.id as string), workspaceId: wsOid,
    }).select("title description status priority createdBy members teamMembers")
      .populate("createdBy", "name")
      .populate("members", "name")
      .populate("teamMembers", "name");

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
      const start = t.startDate ?? t.createdAt ?? new Date();
      const end   = t.dueDate ?? new Date(start.getTime() + 86_400_000);
      return {
        id: t._id.toString(), name: t.title, description: t.description,
        status: t.status, priority: t.priority,
        start: start.toISOString(), end: end.toISOString(),
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

    const { title, description, status, priority, deadline, coverImage, members, teamMembers } =
      req.body as UpdateProjectBody;

    const project = await Project.findOne({
      _id: toOid(req.params.id as string), workspaceId: toOid(workspaceId),
    })
      .populate("createdBy", "name")
      .populate("members", "name")
      .populate("teamMembers", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });
    
    if (!canAccessProject(project, userId, userRole)) {
      console.log("[updateProject] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    const previousTeamMemberIds = (project.teamMembers ?? []).map((member) => member._id.toString());
    if (title       !== undefined) project.title       = title;
    if (description !== undefined) project.description = description;
    if (status      !== undefined) project.status      = status;
    if (priority    !== undefined) project.priority    = priority;
    if (deadline    !== undefined) {
      if (deadline) project.deadline = new Date(deadline);
      else project.set("deadline", undefined);
    }
    if (coverImage !== undefined) {
      if (coverImage) project.coverImage = coverImage;
      else project.set("coverImage", undefined);
    }
    if (members !== undefined) project.members = toObjectIds(members);
    if (teamMembers !== undefined) project.teamMembers = toObjectIds(teamMembers);

    await project.save();
    const populated = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members",   "name email role")
      .populate("teamMembers", "name email role");

    const nextTeamMemberIds = ((project.teamMembers || []) as any[]).map((member) => member._id ? member._id.toString() : member.toString());
    const addedMembers = nextTeamMemberIds.filter((memberId) => !previousTeamMemberIds.includes(memberId));
    const removedMembers = previousTeamMemberIds.filter((memberId) => !nextTeamMemberIds.includes(memberId));

    if (addedMembers.length > 0) {
      await createNotificationsForUsers(addedMembers, {
        type: "user_added",
        title: "Added to Project",
        message: `You have been added to project ${project.title}.`,
        relatedProjectId: project._id.toString(),
        triggeredBy: userId,
        link: buildProjectLink(project._id.toString()),
      });
    }

    if (removedMembers.length > 0) {
      await createNotificationsForUsers(removedMembers, {
        type: "user_removed",
        title: "Removed from Project",
        message: `You have been removed from project ${project.title}.`,
        relatedProjectId: project._id.toString(),
        triggeredBy: userId,
        link: buildProjectLink(project._id.toString()),
      });
    }

    if (title !== undefined || description !== undefined || status !== undefined || priority !== undefined || deadline !== undefined) {
      const isCompleted = status === "Completed";
      await createNotificationsForUsers(nextTeamMemberIds.filter((memberId) => memberId !== userId), {
        type: "project_updated",
        title: isCompleted ? "Project Completed" : "Project Updated",
        message: isCompleted ? `${project.title} was marked as completed.` : `${project.title} was updated.`,
        relatedProjectId: project._id.toString(),
        triggeredBy: userId,
        link: buildProjectLink(project._id.toString()),
      });
    }

    emitDashboardRefresh(workspaceId);

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
      _id: toOid(req.params.id as string), workspaceId: toOid(workspaceId),
    })
      .populate("createdBy", "name")
      .populate("members", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });
    
    if (!canAccessProject(project, userId, userRole)) {
      console.log("[deleteProject] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    await project.deleteOne();
    emitDashboardRefresh(workspaceId);
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
      _id: toOid(req.params.id as string), workspaceId: toOid(workspaceId),
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canAccessProject(project, userId, userRole)) {
      console.log("[uploadCoverImage] Access denied", { userId, projectId: req.params.id });
      return res.status(403).json({ message: "Access denied" });
    }

    const imageData = req.body?.image; // expects base64 data URI
    if (!imageData) return res.status(400).json({ message: "Image data required" });

    project.coverImage = imageData;
    await project.save();

    await createNotificationsForUsers(
      (project.members as Types.ObjectId[]).map((member) => member.toString()).filter((memberId) => memberId !== userId),
      {
        type: "file_uploaded",
        title: "File Uploaded",
        message: `A file was uploaded to ${project.title}.`,
        relatedProjectId: project._id.toString(),
        triggeredBy: userId,
        link: buildProjectLink(project._id.toString()),
      }
    );

    // Populate the project with related fields for the response
    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role")
      .populate("teamMembers", "name email role");

    // Compute task counts for consistency with other endpoints
    const wsOid = toOid(workspaceId);
    const [totalTasks, completedTasks, inProgressTasks] = await Promise.all([
      Task.countDocuments({ project: project._id, workspaceId: wsOid }),
      Task.countDocuments({ project: project._id, workspaceId: wsOid, status: "Completed" }),
      Task.countDocuments({ project: project._id, workspaceId: wsOid, status: "In Progress" }),
    ]);
    const projectWithCounts = { ...populatedProject.toObject(), totalTasks, completedTasks, inProgressTasks };

    // Emit dashboard refresh to update UI
    emitDashboardRefresh(workspaceId);

    return res.status(200).json({ message: "Cover image updated", project: projectWithCounts });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── getProjectMembers ─────────────────────────────────────────────────────────

export const getProjectMembers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const project = await Project.findOne({
      _id: toOid(req.params.id as string),
      workspaceId: toOid(workspaceId),
    }).populate("teamMembers", "name email role");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canAccessProject(project, userId, userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ members: project.teamMembers || [] });
  } catch (error) {
    console.error("[getProjectMembers]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
