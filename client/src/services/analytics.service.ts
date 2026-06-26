import api from "@/lib/axios";

export interface TaskStatusCount {
  status: string;
  count: number;
}

export interface TaskPriorityCount {
  priority: string;
  count: number;
}

export interface WorkloadItem {
  employeeId: string;
  employeeName: string;
  taskCount: number;
}

export interface ProjectProgress {
  projectName: string;
  completionPercent: number;
}

export interface Deadline {
  title: string;
  dueDate: string;
  status: string;
}

export interface AnalyticsDataAdmin {
  role: "admin";
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  statusDistribution: TaskStatusCount[];
  priorityDistribution: TaskPriorityCount[];
  workloadDistribution: WorkloadItem[];
  projectProgressComparison: ProjectProgress[];
  completionTrend: Array<{ date: string; count: number }>;
  recentActivity: Array<{ type: string; description: string; timestamp: string }>;
  upcomingDeadlines: Deadline[];
  overdueTasks: number;
}

export interface AnalyticsDataEmployee {
  role: "employee";
  assignedProjects: number;
  assignedTasks: number;
  completedTasks: number;
  completionRate: number;
  personalStatusDistribution: TaskStatusCount[];
  completionTrend: Array<{ date: string; count: number }>;
  deadlines: Deadline[];
}

export type AnalyticsData = AnalyticsDataAdmin | AnalyticsDataEmployee;

export interface ProjectItem {
  _id: string;
  title: string;
  status: string;
}

export const analyticsService = {
  getData: (projectId?: string) => {
    const params = projectId ? { projectId } : {};
    return api.get<AnalyticsData>("/analytics/data", { params }).then((r) => r.data);
  },

  getProjects: () =>
    api.get<{ projects: ProjectItem[] }>("/analytics/projects").then((r) => r.data.projects),
};
