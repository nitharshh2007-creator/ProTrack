import mongoose, { Document, Schema, Types } from "mongoose";
import crypto from "crypto";

export interface IWorkspaceInvite extends Document {
  token: string;
  workspaceId: Types.ObjectId;
  email: string;
  role: "employee" | "manager";
  createdBy: Types.ObjectId;
  expiresAt: Date;
  status: "pending" | "accepted" | "rejected" | "expired";
  acceptedBy?: Types.ObjectId;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceInviteSchema = new Schema<IWorkspaceInvite>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["employee", "manager"],
      default: "employee",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWorkspaceInvite>(
  "WorkspaceInvite",
  WorkspaceInviteSchema
);
