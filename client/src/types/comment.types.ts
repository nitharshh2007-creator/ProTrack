import type { User } from "./auth.types";

export interface Comment {
  _id: string;
  content: string;
  task: { _id: string; title: string };
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  content: string;
  task: string;
}
