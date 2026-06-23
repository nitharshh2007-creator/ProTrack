import mongoose, { Document, Schema, Types } from "mongoose";

export const USER_ROLES = ["admin", "manager", "member", "employee"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  theme: "light" | "dark" | "system";
  density: "compact" | "comfortable";
  notifications: {
    email: boolean;
    projectUpdates: boolean;
    taskReminders: boolean;
    teamInvites: boolean;
  };
  workspaceId?: Types.ObjectId;
  passwordChangedAt?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "employee",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    density: {
      type: String,
      enum: ["compact", "comfortable"],
      default: "comfortable",
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      projectUpdates: {
        type: Boolean,
        default: true,
      },
      taskReminders: {
        type: Boolean,
        default: true,
      },
      teamInvites: {
        type: Boolean,
        default: true,
      },
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: false,
    },
    passwordChangedAt: {
      type: Date,
      required: false,
    },
    resetToken: {
      type: String,
      required: false,
    },
    resetTokenExpiry: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);
