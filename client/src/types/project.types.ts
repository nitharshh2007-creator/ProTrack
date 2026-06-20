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
  coverImage?: string | null;
  createdBy: User;
  members: User[];
  createdAt: string;
  updatedAt: string;
  completedTasks?: number;
  totalTasks?: number;
  memberCount?: number;
  workspaceId?: string;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  deadline?: string;
  coverImage?: string;
  members?: string[];
}

export type UpdateProjectPayload = Partial<Omit<CreateProjectPayload, "deadline" | "coverImage">> & {
  deadline?: string | null;
  coverImage?: string | null;
};

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  progress: number;
}
