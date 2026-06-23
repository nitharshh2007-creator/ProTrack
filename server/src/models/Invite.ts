import mongoose, { Document, Schema, Types } from "mongoose";
import crypto from "crypto";

export interface IInvite extends Document {
  email: string;
  workspaceId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  token: string;
  accepted: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    accepted: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInvite>("Invite", InviteSchema);
