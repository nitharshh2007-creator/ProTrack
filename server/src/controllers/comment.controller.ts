import type { Request, Response } from "express";
import { Types } from "mongoose";
import Comment from "../models/Comment.ts";
import Task from "../models/Task.ts";
import type { AuthRequest } from "../types/auth.types.ts";

interface CreateCommentBody {
  content?: string;
  task?: string;
}

const isAdmin = (role?: string) => role === "admin";

const toObjectId = (value: string) => new Types.ObjectId(value);

const hasPermissionToDelete = (
  commentUserId: string,
  currentUserId: string,
  role?: string
) => commentUserId === currentUserId || isAdmin(role);

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { content, task } = req.body as CreateCommentBody;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      return res.status(400).json({
        message: "Comment content cannot be empty",
      });
    }

    if (!task) {
      return res.status(400).json({
        message: "Task is required",
      });
    }

    const taskExists = await Task.exists({ _id: task });

    if (!taskExists) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const comment = await Comment.create({
      content: trimmedContent,
      task: toObjectId(task),
      user: toObjectId(userId),
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name email role")
      .populate("task", "title");

    return res.status(201).json({
      message: "Comment created successfully",
      comment: populatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getCommentsByTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const taskId = req.params.taskId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (typeof taskId !== "string" || !taskId) {
      return res.status(400).json({
        message: "Task ID is required",
      });
    }

    const taskExists = await Task.exists({ _id: taskId });

    if (!taskExists) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const comments = await Comment.find({ task: toObjectId(taskId) })
      .populate("user", "name email role")
      .populate("task", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      comments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const commentUserId = comment.user.toString();

    if (!hasPermissionToDelete(commentUserId, userId, role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
