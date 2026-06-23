import type { Response } from "express";
import { Types } from "mongoose";
import Comment from "../models/Comment.ts";
import Task from "../models/Task.ts";
import { resolveWorkspaceId, toOid } from "../middleware/workspace.middleware.ts";
import {
  buildTaskLink,
  createNotificationsForUsers,
  maybeCreateCommentAttachmentNotification,
} from "../services/notification.service.ts";
import type { AuthRequest } from "../types/auth.types.ts";

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const { content, task } = req.body as { content?: string; task?: string };
    const trimmed = content?.trim();
    if (!trimmed) return res.status(400).json({ message: "Comment content cannot be empty" });
    if (!task)    return res.status(400).json({ message: "Task is required" });

    const taskDoc = await Task.findOne({ _id: task, workspaceId: toOid(workspaceId) })
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .populate("project", "title");
    if (!taskDoc) return res.status(404).json({ message: "Task not found" });

    const comment = await Comment.create({
      content: trimmed, task: toOid(task), user: toOid(userId),
    });

    const populated = await Comment.findById(comment._id)
      .populate("user", "name email role")
      .populate("task", "title");

    const taskAny = taskDoc as any;
    const recipients = Array.from(
      new Set(
        [
          taskAny.assignedTo?._id?.toString?.() ?? taskAny.assignedTo?.toString?.(),
          taskAny.createdBy?._id?.toString?.() ?? taskAny.createdBy?.toString?.(),
        ].filter((value): value is string => Boolean(value) && value !== userId)
      )
    );

    await createNotificationsForUsers(recipients, {
      type: "comment_added",
      title: "Comment Added",
      message: `${(req.user?.email ?? "A teammate")} commented on ${taskDoc.title}.`,
      relatedTaskId: taskDoc._id.toString(),
      ...(taskAny.project ? { relatedProjectId: taskAny.project?._id?.toString?.() ?? taskAny.project?.toString?.() } : {}),
      triggeredBy: userId,
      link: buildTaskLink(taskDoc._id.toString()),
    });

    await maybeCreateCommentAttachmentNotification({
      taskId: taskDoc._id.toString(),
      ...(taskAny.project ? { projectId: taskAny.project?._id?.toString?.() ?? taskAny.project?.toString?.() } : {}),
      content: trimmed,
      triggeredBy: userId,
      recipients,
    });

    return res.status(201).json({ message: "Comment created successfully", comment: populated });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};

export const getCommentsByTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const { taskId } = req.params as { taskId: string };
    if (!taskId) return res.status(400).json({ message: "Task ID is required" });

    const taskExists = await Task.exists({ _id: taskId, workspaceId: toOid(workspaceId) });
    if (!taskExists) return res.status(404).json({ message: "Task not found" });

    const comments = await Comment.find({ task: toOid(taskId) })
      .populate("user", "name email role")
      .populate("task", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({ comments });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const comment = await Comment.findById(req.params.id).populate("task", "workspaceId");
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const taskDoc = comment.task as unknown as { workspaceId?: Types.ObjectId };
    if (taskDoc?.workspaceId?.toString() !== workspaceId)
      return res.status(403).json({ message: "Access denied" });

    if (comment.user.toString() !== userId && userRole !== "admin")
      return res.status(403).json({ message: "Not authorized to delete this comment" });

    await Comment.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch { return res.status(500).json({ message: "Server Error" }); }
};
