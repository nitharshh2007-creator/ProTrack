import type { User } from "./auth.types";

export type ProjectStatus = "Planning" | "Active" | "Completed";
export type ProjectPriority = "Low" | "Medium" | "High";

export interface Project {
  _id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  createdBy: User;
  members: User[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  deadline?: string;
  members?: string[];
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  deadline?: string | null;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  progress: number;
}
