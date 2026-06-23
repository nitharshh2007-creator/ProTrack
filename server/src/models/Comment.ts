import mongoose, { Document, Schema, Types } from "mongoose";

export interface IComment extends Document {
  content: string;
  task: Types.ObjectId;
  user: Types.ObjectId;
}

const CommentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IComment>("Comment", CommentSchema);
