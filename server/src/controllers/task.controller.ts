import type { Request, Response } from "express";
import { Types } from "mongoose";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import User from "../models/User.ts";
import type { AuthRequest } from "../types/auth.types.ts";

type TaskStatus = "Todo" | "In Progress" | "Review" | "Blocked" | "Completed";
type TaskPriority = "Low" | "Medium" | "High";

interface CreateTaskBody {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  project?: string;
  assignedTo?: string;
  dueDate?: string;
}

interface UpdateTaskBody {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  project?: string;
  assignedTo?: string;
  dueDate?: string;
}

const parseDate = (value: string) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const validateTaskDates = (startDate: Date, dueDate: Date) => {
  if (startDate.getTime() > dueDate.getTime()) {
    return {
      status: 400,
      message: "startDate must be less than or equal to dueDate",
    } as const;
  }

  return null;
};

const populateTask = () =>
  Task.find()
    .populate("project", "title description status priority")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role");

const isPrivilegedRole = (role?: string) => role === "admin" || role === "manager";

const buildTaskQueryForUser = (userId: string, role?: string) => {
  if (isPrivilegedRole(role)) {
    return {};
  }

  return {
    $or: [{ assignedTo: new Types.ObjectId(userId) }, { createdBy: new Types.ObjectId(userId) }],
  };
};

const validateTaskRefs = async (projectId?: string, assignedToId?: string) => {
  if (projectId) {
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      return {
        status: 404,
        message: "Project not found",
      } as const;
    }
  }

  if (assignedToId) {
    const userExists = await User.exists({ _id: assignedToId });
    if (!userExists) {
      return {
        status: 404,
        message: "Assigned user not found",
      } as const;
    }
  }

  return null;
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, priority, startDate, project, assignedTo, dueDate } =
      req.body as CreateTaskBody;

    if (!title || !description || !project || !assignedTo || !startDate || !dueDate) {
      return res.status(400).json({
        message: "Title, description, startDate, dueDate, project, and assigned user are required",
      });
    }

    const parsedStartDate = parseDate(startDate);
    const parsedDueDate = parseDate(dueDate);

    if (!parsedStartDate || !parsedDueDate) {
      return res.status(400).json({
        message: "startDate and dueDate must be valid dates",
      });
    }

    const dateValidationError = validateTaskDates(parsedStartDate, parsedDueDate);

    if (dateValidationError) {
      return res.status(dateValidationError.status).json({
        message: dateValidationError.message,
      });
    }

    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !isPrivilegedRole(userRole)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const validationError = await validateTaskRefs(project, assignedTo);

    if (validationError) {
      return res.status(validationError.status).json({
        message: validationError.message,
      });
    }

    const task = await Task.create({
      title,
      description,
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      startDate: parsedStartDate,
      project: new Types.ObjectId(project),
      assignedTo: new Types.ObjectId(assignedTo),
      createdBy: new Types.ObjectId(userId),
      dueDate: parsedDueDate,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("project", "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    return res.status(201).json({
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const tasks = await Task.find(buildTaskQueryForUser(userId, userRole))
      .populate("project", "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getMyTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const tasks = await Task.find({ assignedTo: new Types.ObjectId(userId) })
      .populate("project", "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const task = await Task.findById(req.params.id)
      .populate("project", "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!isPrivilegedRole(userRole)) {
      const currentUserId = userId;
      const assignedToId = task.assignedTo instanceof Types.ObjectId ? task.assignedTo.toString() : String(task.assignedTo);
      const createdById = task.createdBy instanceof Types.ObjectId ? task.createdBy.toString() : String(task.createdBy);

      if (assignedToId !== currentUserId && createdById !== currentUserId) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    }

    return res.status(200).json({
      task,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, priority, startDate, project, assignedTo, dueDate } =
      req.body as UpdateTaskBody;

    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!isPrivilegedRole(userRole)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const validationError = await validateTaskRefs(project, assignedTo);

    if (validationError) {
      return res.status(validationError.status).json({
        message: validationError.message,
      });
    }

    const nextStartDate = startDate !== undefined ? parseDate(startDate) : task.startDate;
    const nextDueDate = dueDate !== undefined ? parseDate(dueDate) : task.dueDate;

    if (!(nextStartDate instanceof Date) || !(nextDueDate instanceof Date)) {
      return res.status(400).json({
        message: "startDate and dueDate must be valid dates",
      });
    }

    const dateValidationError = validateTaskDates(nextStartDate, nextDueDate);

    if (dateValidationError) {
      return res.status(dateValidationError.status).json({
        message: dateValidationError.message,
      });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (startDate !== undefined) {
      task.startDate = nextStartDate;
    }
    if (project !== undefined) task.project = new Types.ObjectId(project);
    if (assignedTo !== undefined) task.assignedTo = new Types.ObjectId(assignedTo);
    if (dueDate !== undefined) {
      task.dueDate = nextDueDate;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("project", "title description status priority")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    return res.status(200).json({
      message: "Task updated successfully",
      task: populatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (userRole !== "admin") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
