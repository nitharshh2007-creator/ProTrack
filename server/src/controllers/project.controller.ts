import type { Request, Response } from "express";
import { Types } from "mongoose";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";
import type { AuthRequest } from "../types/auth.types.ts";

type ProjectStatus = "Planning" | "Active" | "Completed";
type ProjectPriority = "Low" | "Medium" | "High";
type KanbanStatus = "Todo" | "In Progress" | "Review" | "Blocked" | "Completed";

interface KanbanTask {
  _id: Types.ObjectId;
  title: string;
  status: KanbanStatus;
  assignedTo: unknown;
  createdBy: unknown;
}

interface KanbanBoard {
  Todo: KanbanTask[];
  "In Progress": KanbanTask[];
  Review: KanbanTask[];
  Blocked: KanbanTask[];
  Completed: KanbanTask[];
}

interface TimelineTask {
  _id: Types.ObjectId;
  title: string;
  startDate?: Date;   // optional — legacy tasks may not have this field
  dueDate: Date;
  status: KanbanStatus;
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

const toObjectIds = (values: string[] = []) =>
  values.map((value) => new Types.ObjectId(value));

const populateProject = () =>
  Project.find()
    .populate("createdBy", "name email role")
    .populate("members", "name email role");

const emptyKanbanBoard = (): KanbanBoard => ({
  Todo: [],
  "In Progress": [],
  Review: [],
  Blocked: [],
  Completed: [],
});

export const createProject = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { title, description, status, priority, deadline, members } =
      req.body as CreateProjectBody;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    const createdBy = req.user?.userId;

    if (!createdBy) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const projectData = {
      title,
      description,
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(deadline !== undefined ? { deadline } : {}),
      createdBy: new Types.ObjectId(createdBy),
      members: toObjectIds(members),
    };

    const project = await Project.create(projectData);

    const populatedProject = await project.populate([
      { path: "createdBy", select: "name email role" },
      { path: "members", select: "name email role" },
    ]);

    return res.status(201).json({
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getProjects = async (_req: Request, res: Response) => {
  try {
    const projects = await populateProject();

    return res.status(200).json({
      projects,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      project,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getProjectProgress = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).select("title");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ project: project._id }),
      Task.countDocuments({ project: project._id, status: "Completed" }),
    ]);

    const pendingTasks = totalTasks - completedTasks;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return res.status(200).json({
      projectId: project._id,
      projectName: project.title,
      totalTasks,
      completedTasks,
      pendingTasks,
      progress,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getProjectKanban = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).select("title");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const tasks = await Task.find({ project: project._id })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const board = emptyKanbanBoard();

    for (const task of tasks) {
      const status = task.status as KanbanStatus;

      if (status in board) {
        board[status].push({
          _id: task._id,
          title: task.title,
          status,
          assignedTo: task.assignedTo,
          createdBy: task.createdBy,
        });
      }
    }

    return res.status(200).json(board);
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getProjectTimeline = async (req: Request, res: Response) => {
  console.log("[getProjectTimeline] Called with projectId:", req.params.id);
  try {
    const project = await Project.findById(req.params.id)
      .select("title description status priority");

    if (!project) {
      console.log("[getProjectTimeline] Project not found");
      return res.status(404).json({ message: "Project not found" });
    }

    console.log("[getProjectTimeline] Found project:", project.title);

    const [tasks, progress] = await Promise.all([
      Task.find({ project: project._id })
        .select("title description status priority startDate dueDate assignedTo createdAt")
        .populate("assignedTo", "name email")
        .sort({ startDate: 1, dueDate: 1, createdAt: 1 })
        .lean(),
      Task.aggregate<{ total: number; completed: number }>([
        { $match: { project: project._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const totals = progress[0] ?? { total: 0, completed: 0 };
    const progressPct = totals.total === 0 ? 0 : Math.round((totals.completed / totals.total) * 100);

    const getProgress = (status: KanbanStatus): number => {
      switch (status) {
        case "Completed":  return 100;
        case "Review":     return 75;
        case "In Progress":return 50;
        case "Blocked":    return 25;
        default:           return 0;
      }
    };

    const timeline = tasks.map((task) => {
      const startDate = task.startDate ?? task.createdAt;
      const endDate = task.dueDate ?? new Date(new Date(startDate).getTime() + 86_400_000);

      return {
        id:         task._id.toString(),
        name:       task.title,
        description:task.description,
        status:     task.status,
        priority:   task.priority,
        start:      new Date(startDate).toISOString(),
        end:        new Date(endDate).toISOString(),
        progress:   getProgress(task.status as KanbanStatus),
        assignedTo: task.assignedTo,
      };
    });

    return res.status(200).json({
      project: {
        id:          project._id.toString(),
        title:       project.title,
        description: project.description,
        status:      project.status,
        priority:    project.priority,
        progress:    progressPct,
      },
      tasks: timeline,
    });
  } catch (error) {
    console.error("[getProjectTimeline] ERROR:", error instanceof Error ? error.message : String(error));
    console.error("[getProjectTimeline] STACK:", error instanceof Error ? error.stack : "");
    return res.status(500).json({ 
      message: "Server Error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const updateProject = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { title, description, status, priority, deadline, members } =
      req.body as UpdateProjectBody;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (deadline !== undefined) {
      if (deadline) {
        project.deadline = new Date(deadline);
      } else {
        project.set("deadline", undefined);
      }
    }
    if (members !== undefined) {
      project.members = toObjectIds(members);
    }

    await project.save();
    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    if (!populatedProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      message: "Project updated successfully",
      project: populatedProject,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};