import type { Response } from "express";
import { Types } from "mongoose";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import User from "../models/User.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import { buildTaskLink, createNotification, createNotificationsForUsers } from "../services/notification.service.ts";
import { emitDashboardRefresh, emitAnalyticsRefresh, emitAnalyticsRefreshToUser } from "../realtime/socket.ts";
import type { AuthRequest } from "../types/auth.types.ts";

type TaskStatus = "Todo" | "In Progress" | "Review" | "Blocked" | "Completed";
type TaskPriority = "Low" | "Medium" | "High";

interface CreateTaskBody {
  title?: string; description?: string; status?: TaskStatus; priority?: TaskPriority;
  startDate?: string; project?: string; assignedTo?: string; dueDate?: string;
}
interface UpdateTaskBody extends Partial<CreateTaskBody> {}

const parseDate = (v: string) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const validateDates = (s: Date, d: Date) =>
  s.getTime() > d.getTime() ? ({ status: 400 as const, message: "startDate must be ≤ dueDate" }) : null;
const isPrivileged = (role?: string) => role === "admin" || role === "manager";

const projectOwnedBy = async (projectId: unknown, userId: string) => {
  const p = await Project.findById(projectId).select("createdBy");
  if (!p) return false;
  const cb = p.createdBy as { _id?: Types.ObjectId } | Types.ObjectId | string;
  const id = cb && typeof cb === "object" && "_id" in cb ? (cb as { _id: Types.ObjectId })._id : (cb as Types.ObjectId | string);
  return id?.toString() === userId;
};

const validateRefs = async (workspaceId: string, projectId?: string, assignedToId?: string) => {
  if (projectId && !await Project.exists({ _id: projectId, workspaceId: toOid(workspaceId) }))
    return { status: 404 as const, message: "Project not found" };
  if (assignedToId && !await User.exists({ _id: assignedToId, workspaceId: toOid(workspaceId) }))
    return { status: 404 as const, message: "Assigned user not found in workspace" };
  return null;
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!isPrivileged(userRole)) return res.status(403).json({ message: "Access denied" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const { title, description, status, priority, startDate, project, assignedTo, dueDate } =
      req.body as CreateTaskBody;
    if (!title || !description || !project || !assignedTo || !startDate || !dueDate)
      return res.status(400).json({
        message: "title, description, startDate, dueDate, project and assignedTo are required",
      });

    const parsedStart = parseDate(startDate);
    const parsedDue = parseDate(dueDate);
    if (!parsedStart || !parsedDue)
      return res.status(400).json({ message: "startDate and dueDate must be valid dates" });

    const dateErr = validateDates(parsedStart, parsedDue);
    if (dateErr) return res.status(dateErr.status).json({ message: dateErr.message });

    const refErr = await validateRefs(workspaceId, project, assignedTo);
    if (refErr) return res.status(refErr.status).json({ message: refErr.message });

    const task = await Task.create({
      title, description,
      ...(status   !== undefined ? { status }   : {}),
      ...(priority !== undefined ? { priority } : {}),
      startDate: parsedStart,
      project: toOid(project), assignedTo: toOid(assignedTo),
      createdBy: toOid(userId), dueDate: parsedDue,
      workspaceId: toOid(workspaceId),
    });

    const populated = await Task.findById(task._id)
      .populate("project",    "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy",  "name email role");

    const assignedToId = task.assignedTo.toString();
    if (assignedToId !== userId) {
      await createNotification({
        userId: assignedToId,
        type: "task_assigned",
        title: "Task Assigned",
        message: `You have been assigned to ${task.title}.`,
        relatedTaskId: task._id.toString(),
        relatedProjectId: task.project.toString(),
        triggeredBy: userId,
        link: buildTaskLink(task._id.toString()),
      });
    }

    emitDashboardRefresh(workspaceId);
    emitAnalyticsRefresh(workspaceId);
    emitAnalyticsRefreshToUser(assignedTo);

    return res.status(201).json({ message: "Task created successfully", task: populated });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const wsOid = toOid(workspaceId);
    const filter: Record<string, unknown> = userRole === "admin"
      ? { workspaceId: wsOid }
      : { workspaceId: wsOid, $or: [{ assignedTo: toOid(userId) }, { createdBy: toOid(userId) }] };

    const tasks = await Task.find(filter)
      .populate("project",    "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy",  "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ tasks });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};

export const getMyTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const tasks = await Task.find({
      assignedTo: toOid(userId),
      workspaceId: toOid(workspaceId),
    })
      .populate("project",    "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy",  "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ tasks });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid task ID format" });

    const task = await Task.findOne({ _id: toOid(id), workspaceId: toOid(workspaceId) })
      .populate("project",    "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy",  "name email role");

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (userRole === "admin") {
      // Admins can view any task in their workspace
    } else {
      const aId = (task.assignedTo as unknown as { _id: Types.ObjectId })?._id?.toString() ?? task.assignedTo?.toString();
      const cId = (task.createdBy  as unknown as { _id: Types.ObjectId })?._id?.toString() ?? task.createdBy?.toString();
      if (aId !== userId && cId !== userId)
        return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ task });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const { title, description, status, priority, startDate, project, assignedTo, dueDate } =
      req.body as UpdateTaskBody;
    const task = await Task.findOne({ _id: toOid(req.params.id as string), workspaceId: toOid(workspaceId) });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Employees can only update the status of tasks assigned to them
    if (!isPrivileged(userRole)) {
      const aId = (task.assignedTo as unknown as { _id: Types.ObjectId })?._id?.toString() ?? task.assignedTo?.toString();
      if (aId !== userId) return res.status(403).json({ message: "Access denied" });
      if (title !== undefined || description !== undefined || priority !== undefined ||
          startDate !== undefined || project !== undefined || assignedTo !== undefined || dueDate !== undefined) {
        return res.status(403).json({ message: "Employees can only update task status" });
      }
      if (status !== undefined) task.status = status;
      await task.save();
      const populatedEmp = await Task.findById(task._id)
        .populate("project",    "title description status priority")
        .populate("assignedTo", "name email role")
        .populate("createdBy",  "name email role");
      return res.status(200).json({ message: "Task updated successfully", task: populatedEmp });
    }

    const previousAssignedTo = task.assignedTo.toString();
    const previousStatus = task.status;
    const previousTitle = task.title;
    const previousProject = task.project.toString();

    const refErr = await validateRefs(workspaceId, project, assignedTo);
    if (refErr) return res.status(refErr.status).json({ message: refErr.message });

    const nextStart = startDate !== undefined ? parseDate(startDate) : task.startDate ?? null;
    const nextDue   = dueDate   !== undefined ? parseDate(dueDate)   : task.dueDate   ?? null;
    if (startDate !== undefined && !(nextStart instanceof Date))
      return res.status(400).json({ message: "startDate must be a valid date" });
    if (dueDate !== undefined && !(nextDue instanceof Date))
      return res.status(400).json({ message: "dueDate must be a valid date" });
    if (nextStart instanceof Date && nextDue instanceof Date) {
      const err = validateDates(nextStart, nextDue);
      if (err) return res.status(err.status).json({ message: err.message });
    }

    if (title       !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (status      !== undefined) task.status      = status;
    if (priority    !== undefined) task.priority    = priority;
    if (startDate   !== undefined && nextStart instanceof Date) task.startDate = nextStart;
    if (project     !== undefined) task.project    = toOid(project);
    if (assignedTo  !== undefined) task.assignedTo = toOid(assignedTo);
    if (dueDate     !== undefined && nextDue instanceof Date) task.dueDate = nextDue;

    await task.save();
    const populated = await Task.findById(task._id)
      .populate("project",    "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy",  "name email role");

    const nextAssignedTo = task.assignedTo.toString();
    const changedAssignedTo = assignedTo !== undefined && nextAssignedTo !== previousAssignedTo;
    const changedStatus = status !== undefined && status !== previousStatus;
    const changedCoreFields = title !== undefined || description !== undefined || startDate !== undefined || dueDate !== undefined || project !== undefined || priority !== undefined;

    if (changedAssignedTo) {
      const recipients = [nextAssignedTo, previousAssignedTo].filter(Boolean);
      await createNotificationsForUsers(recipients, {
        type: "task_reassigned",
        title: "Task Reassigned",
        message: `The task ${task.title} was reassigned.`,
        relatedTaskId: task._id.toString(),
        relatedProjectId: task.project.toString(),
        triggeredBy: userId,
        link: buildTaskLink(task._id.toString()),
      });
    }

    if (changedStatus && task.status === "Completed") {
      await createNotificationsForUsers([previousAssignedTo, task.createdBy.toString()], {
        type: "task_completed",
        title: "Task Completed",
        message: `${task.title} was marked as completed.`,
        relatedTaskId: task._id.toString(),
        relatedProjectId: task.project.toString(),
        triggeredBy: userId,
        link: buildTaskLink(task._id.toString()),
      });
    } else if (changedCoreFields) {
      await createNotificationsForUsers([previousAssignedTo, task.createdBy.toString()], {
        type: "task_updated",
        title: "Task Updated",
        message: `${task.title} was updated.`,
        relatedTaskId: task._id.toString(),
        relatedProjectId: task.project.toString(),
        triggeredBy: userId,
        link: buildTaskLink(task._id.toString()),
      });
    }

    emitDashboardRefresh(workspaceId);
    emitAnalyticsRefresh(workspaceId);
    if (changedAssignedTo) emitAnalyticsRefreshToUser(nextAssignedTo);
    emitAnalyticsRefreshToUser(previousAssignedTo);

    return res.status(200).json({ message: "Task updated successfully", task: populated });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (userRole !== "admin") return res.status(403).json({ message: "Access denied" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const task = await Task.findOne({ _id: toOid(req.params.id as string), workspaceId: toOid(workspaceId) });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const assignedToId = task.assignedTo.toString();
    await task.deleteOne();
    emitDashboardRefresh(workspaceId);
    emitAnalyticsRefresh(workspaceId);
    emitAnalyticsRefreshToUser(assignedToId);
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};
