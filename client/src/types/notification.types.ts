export type NotificationType =
  | "task_assigned"
  | "task_reassigned"
  | "task_created"
  | "task_completed"
  | "task_updated"
  | "comment_added"
  | "reply_added"
  | "project_created"
  | "project_updated"
  | "file_uploaded"
  | "video_uploaded"
  | "audio_uploaded"
  | "deadline_reminder"
  | "task_overdue"
  | "user_added"
  | "user_removed";

export interface NotificationItem {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: string;
  relatedProjectId?: string;
  triggeredBy?: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
}
