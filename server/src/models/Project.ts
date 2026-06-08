import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  status: "Planning" | "Active" | "Completed";
  priority: "Low" | "Medium" | "High";
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
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
      enum: ["Planning", "Active", "Completed"],
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProject>("Project", ProjectSchema);