import api from "@/lib/axios";
import type { CreateTaskPayload, Task, UpdateTaskPayload } from "@/types";

export const taskService = {
  getAll: () =>
    api.get<{ tasks: Task[] }>("/tasks").then((r) => r.data.tasks),

  getMyTasks: () =>
    api.get<{ tasks: Task[] }>("/tasks/my-tasks").then((r) => r.data.tasks),

  getById: (id: string) =>
    api.get<{ task: Task }>(`/tasks/${id}`).then((r) => r.data.task),

  create: (payload: CreateTaskPayload) =>
    api.post<{ message: string; task: Task }>("/tasks", payload).then((r) => r.data),

  update: (id: string, payload: UpdateTaskPayload) =>
    api.put<{ message: string; task: Task }>(`/tasks/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/tasks/${id}`).then((r) => r.data),
};
