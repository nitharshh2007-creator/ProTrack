import api from "@/lib/axios";

export interface AnalyticsOverview {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByProject: { projectId: string; projectTitle: string; count: number }[];
}

export const analyticsService = {
  getOverview: () =>
    api.get<AnalyticsOverview>("/analytics/overview").then((r) => r.data),
};
