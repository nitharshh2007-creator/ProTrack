import type { User } from "./auth.types";
import type { Project } from "./project.types";

export type TaskStatus = "Todo" | "In Progress" | "Review" | "Blocked" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  project: Project;
  assignedTo: User;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  project: string;
  assignedTo: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;
