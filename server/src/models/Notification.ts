import mongoose, { Document, Schema, Types } from "mongoose";

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
  | "user_removed"
  | "team_member_invited"
  | "team_member_joined"
  | "team_member_blocked";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: Types.ObjectId;
  relatedProjectId?: Types.ObjectId;
  triggeredBy?: Types.ObjectId;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "task_assigned",
        "task_reassigned",
        "task_created",
        "task_completed",
        "task_updated",
        "comment_added",
        "reply_added",
        "project_created",
        "project_updated",
        "file_uploaded",
        "video_uploaded",
        "audio_uploaded",
        "deadline_reminder",
        "task_overdue",
        "user_added",
        "user_removed",
        "team_member_invited",
        "team_member_joined",
        "team_member_blocked",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: false,
    },
    relatedProjectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    triggeredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    link: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);
