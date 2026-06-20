import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  status: "Planning" | "Active" | "Completed" | "Archived";
  priority: "Low" | "Medium" | "High";
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  coverImage?: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  workspaceId: Types.ObjectId;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Planning", "Active", "Completed", "Archived"],
      default: "Planning",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    coverImage: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProject>("Project", ProjectSchema);
