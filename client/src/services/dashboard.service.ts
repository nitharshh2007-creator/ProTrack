import api from "@/lib/axios";
import type { DashboardStats, ProjectReport } from "@/types";

export const dashboardService = {
  getStats: () =>
    api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),

  getProjectReport: (projectId: string) =>
    api.get<ProjectReport>(`/reports/project/${projectId}`).then((r) => r.data),
};
