import type { TaskStatus, TaskPriority } from "./task.types";

export interface TimelineItem {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  start: string;
  end: string;
  progress: number;
  assignedTo: { _id: string; name: string; email: string } | null;
}

export interface TimelineProject {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
}

export interface TimelineResponse {
  project: TimelineProject;
  tasks: TimelineItem[];
}
