import type { TaskStatus } from "./task.types";

export interface KanbanTask {
  _id: string;
  title: string;
  status: TaskStatus;
  assignedTo: unknown;
  createdBy: unknown;
}

export interface KanbanBoard {
  Todo: KanbanTask[];
  "In Progress": KanbanTask[];
  Review: KanbanTask[];
  Blocked: KanbanTask[];
  Completed: KanbanTask[];
}

export type KanbanColumn = keyof KanbanBoard;
