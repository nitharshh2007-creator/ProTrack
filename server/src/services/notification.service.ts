import Notification, { type NotificationType, type INotification } from "../models/Notification.ts";
import Task from "../models/Task.ts";
import { emitNotificationCreated } from "../realtime/socket.ts";
import { toOid } from "../middleware/workspace.middleware.ts";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string;
  relatedProjectId?: string;
  triggeredBy?: string;
  link?: string;
};

const toUniqueIds = (ids: Array<string | undefined | null>) =>
  Array.from(new Set(ids.filter((value): value is string => Boolean(value))));

export const createNotification = async (input: CreateNotificationInput) => {
  const notification = await Notification.create({
    userId: toOid(input.userId),
    type: input.type,
    title: input.title,
    message: input.message,
    ...(input.relatedTaskId ? { relatedTaskId: toOid(input.relatedTaskId) } : {}),
    ...(input.relatedProjectId ? { relatedProjectId: toOid(input.relatedProjectId) } : {}),
    ...(input.triggeredBy ? { triggeredBy: toOid(input.triggeredBy) } : {}),
    ...(input.link ? { link: input.link } : {}),
  });

  emitNotificationCreated(notification);
  return notification;
};

export const createNotificationsForUsers = async (userIds: Array<string | undefined | null>, input: Omit<CreateNotificationInput, "userId">) => {
  const ids = toUniqueIds(userIds);
  return Promise.all(ids.map((userId) => createNotification({ userId, ...input })));
};

export const buildTaskLink = (taskId: string) => `/tasks/${taskId}`;
export const buildProjectLink = (projectId: string) => `/projects/${projectId}`;

const attachmentTypeFromContent = (content: string) => {
  const matches = Array.from(content.matchAll(/\[📎\s+([^\]]+)\]\(([^)]+)\)/g));
  const names = matches.map((match) => (match[1] ?? "").toLowerCase());
  if (names.length === 0) return null;

  const hasVideo = names.some((name) => /\.(mp4|mov|webm|avi)$/i.test(name));
  const hasAudio = names.some((name) => /\.(mp3|wav|ogg|m4a)$/i.test(name));
  if (hasVideo) return "video_uploaded" as const;
  if (hasAudio) return "audio_uploaded" as const;
  return "file_uploaded" as const;
};

export const maybeCreateCommentAttachmentNotification = async (params: {
  taskId: string;
  projectId?: string;
  content: string;
  triggeredBy?: string;
  recipients: string[];
}) => {
  const type = attachmentTypeFromContent(params.content);
  if (!type) return [];

  return createNotificationsForUsers(params.recipients, {
    type,
    title:
      type === "video_uploaded"
        ? "Video Uploaded"
        : type === "audio_uploaded"
          ? "Audio Uploaded"
          : "File Uploaded",
    message:
      type === "video_uploaded"
        ? "A video was attached to a task comment."
        : type === "audio_uploaded"
          ? "An audio file was attached to a task comment."
          : "A file was attached to a task comment.",
    relatedTaskId: params.taskId,
    ...(params.projectId ? { relatedProjectId: params.projectId } : {}),
    ...(params.triggeredBy ? { triggeredBy: params.triggeredBy } : {}),
    link: buildTaskLink(params.taskId),
  });
};

export const sendDeadlineNotifications = async () => {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcomingTasks = await Task.find({
    dueDate: { $gt: now, $lte: in24Hours },
    status: { $ne: "Completed" },
  })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "title")
    .lean();

  const overdueTasks = await Task.find({
    dueDate: { $lt: now },
    status: { $ne: "Completed" },
  })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "title")
    .lean();

  const createIfMissing = async (task: any, type: NotificationType, title: string, message: string) => {
    const existing = await Notification.exists({
      type,
      relatedTaskId: task._id,
    });
    if (existing) return;

    const recipients = toUniqueIds([
      task.assignedTo?._id?.toString?.() ?? task.assignedTo?.toString?.(),
      task.createdBy?._id?.toString?.() ?? task.createdBy?.toString?.(),
    ]);

    await createNotificationsForUsers(recipients, {
      type,
      title,
      message,
      relatedTaskId: task._id.toString(),
      ...(task.project ? { relatedProjectId: task.project?._id?.toString?.() ?? task.project?.toString?.() } : {}),
      link: buildTaskLink(task._id.toString()),
    });
  };

  await Promise.all([
    ...upcomingTasks.map((task) =>
      createIfMissing(
        task,
        "deadline_reminder",
        "Deadline Reminder",
        `${task.title} is due soon.`
      )
    ),
    ...overdueTasks.map((task) =>
      createIfMissing(
        task,
        "task_overdue",
        "Task Overdue",
        `${task.title} is overdue.`
      )
    ),
  ]);
};

export type { INotification };
