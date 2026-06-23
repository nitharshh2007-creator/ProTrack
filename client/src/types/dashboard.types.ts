export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  link?: string;
  projectName?: string;
  taskTitle?: string;
  actorName?: string;
}

export interface DashboardDeadline {
  id: string;
  title: string;
  projectName: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "Todo" | "In Progress" | "Review" | "Blocked" | "Completed";
}

export interface DashboardStatusCount {
  status: "Todo" | "In Progress" | "Review" | "Blocked" | "Completed";
  count: number;
}

export interface DashboardUser {
  name: string;
  role: string;
}

export interface AdminDashboardStats {
  user: DashboardUser;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks?: number;
  blockedTasks?: number;
  completionRate: number;
  taskStatusDistribution: DashboardStatusCount[];
  recentActivities: DashboardActivity[];
  upcomingDeadlines: DashboardDeadline[];
  activeMembers?: number;
}

export interface EmployeeDashboardStats {
  user: DashboardUser;
  assignedProjectCount: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  assignedProjects: {
    _id: string;
    title: string;
    description: string;
    status: string;
    progress: number;
    dueDate: string | null;
  }[];
  assignedTasks: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    projectName: string;
  }[];
  recentActivities: DashboardActivity[];
  upcomingDeadlines: DashboardDeadline[];
}

export type DashboardStats = AdminDashboardStats | EmployeeDashboardStats;

export function isEmployeeDashboardStats(stats: DashboardStats): stats is EmployeeDashboardStats {
  return stats.user.role === "employee";
}

export function isAdminDashboardStats(stats: DashboardStats): stats is AdminDashboardStats {
  return stats.user.role === "admin" || stats.user.role === "manager";
}

export interface ProjectReport {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  progress: number;
}
