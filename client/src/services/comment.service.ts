import api from "@/lib/axios";
import type { Comment, CreateCommentPayload } from "@/types";

export const commentService = {
  getByTask: (taskId: string) =>
    api.get<{ comments: Comment[] }>(`/comments/task/${taskId}`).then((r) => r.data.comments),

  create: (payload: CreateCommentPayload) =>
    api.post<{ message: string; comment: Comment }>("/comments", payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/comments/${id}`).then((r) => r.data),
};
