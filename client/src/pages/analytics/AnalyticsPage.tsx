import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { analyticsService, type AnalyticsData, type AnalyticsDataAdmin, type AnalyticsDataEmployee } from "@/services";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/auth.store";
import { getSocket } from "@/lib/socket";

const STATUS_COLORS: Record<string, string> = {
  Todo: "#94a3b8",
  "In Progress": "#3b82f6",
  Review: "#f59e0b",
  Blocked: "#ef4444",
  Completed: "#22c55e",
};

const PROJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#22c55e", "#06b6d4", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48",
];

const StatCard: React.FC<{ label: string; value: number | string; color: string; description?: string }> = ({
  label,
  value,
  color,
  description,
}) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300" style={{ borderTop: `4px solid ${color}` }}>
    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400 mb-3">{label}</p>
    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{value}</p>
    {description && <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>}
  </div>
);

export const AnalyticsPage = () => {
  const { hasRole } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<{ _id: string; title: string; status: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState("all");

  const loadData = useCallback(() => {
    analyticsService
      .getData(selectedProject !== "all" ? selectedProject : undefined)
      .then(setData)
      .catch(() => setError("Failed to load analytics data."))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  useEffect(() => {
    if (hasRole("admin", "manager")) {
      analyticsService.getProjects()
        .then(setProjects)
        .catch(console.error);
    }
  }, [hasRole]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [selectedProject, loadData]);

  // Real-time updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getSocket(token);
    socket.connect();

    const handleRefresh = () => {
      loadData();
    };

    socket.on("analytics:refresh", handleRefresh);

    return () => {
      socket.off("analytics:refresh", handleRefresh);
    };
  }, [loadData]);

  if (!hasRole("admin", "manager", "employee")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center pt-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const isAdmin = data.role === "admin";
  const adminData = data as AnalyticsDataAdmin;
  const employeeData = data as AnalyticsDataEmployee;

  return (
    <div className="space-y-8">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#101728] px-8 py-12 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {isAdmin ? "Workspace" : "Personal"}
          </p>
          <h1 className="text-3xl font-bold text-white">
            {isAdmin ? "Analytics Dashboard" : "My Analytics"}
          </h1>
          <p className="text-sm text-slate-400">
            {isAdmin
              ? "Track project performance, task completion and team productivity."
              : "Track your assigned projects and task performance."}
          </p>
        </div>
      </div>

      {/* PROJECT FILTER (ADMIN ONLY) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block uppercase tracking-wider">
            Filter by Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full md:w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* STATISTICS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isAdmin ? (
          <>
            <StatCard
              label="Total Projects"
              value={adminData.totalProjects}
              color="#3b82f6"
              description="All projects in workspace"
            />
            <StatCard
              label="Active Projects"
              value={adminData.activeProjects}
              color="#22c55e"
              description="Currently active projects"
            />
            <StatCard
              label="Completed Projects"
              value={adminData.completedProjects}
              color="#10b981"
              description="Successfully completed"
            />
            <StatCard
              label="Total Tasks"
              value={adminData.totalTasks}
              color="#f59e0b"
              description="All tasks in workspace"
            />
            <StatCard
              label="Completed Tasks"
              value={adminData.completedTasks}
              color="#22c55e"
              description="Tasks finished"
            />
            <StatCard
              label="Completion Rate"
              value={`${adminData.completionRate}%`}
              color="#6366f1"
              description="Overall progress"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Assigned Projects"
              value={employeeData.assignedProjects}
              color="#3b82f6"
              description="Your assigned projects"
            />
            <StatCard
              label="Assigned Tasks"
              value={employeeData.assignedTasks}
              color="#f59e0b"
              description="Total assigned to you"
            />
            <StatCard
              label="Completed Tasks"
              value={employeeData.completedTasks}
              color="#22c55e"
              description="Tasks you finished"
            />
            <StatCard
              label="Completion Rate"
              value={`${employeeData.completionRate}%`}
              color="#6366f1"
              description="Your progress rate"
            />
          </>
        )}
      </div>

      {/* ADMIN CHARTS */}
      {isAdmin && (
        <>
          {/* Task Status Distribution */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Distribution</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Task Status</h2>
            </div>
            {adminData.statusDistribution.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No data available.
              </div>
            ) : (
              <div style={{ minHeight: "550px" }}>
                <ResponsiveContainer width="100%" height={550}>
                  <PieChart>
                    <Pie
                      data={adminData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={150}
                      paddingAngle={2}
                      dataKey="count"
                      label={({ status, percent }) =>
                        `${status} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {adminData.statusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} tasks`, "Tasks"]}
                      contentStyle={{ backgroundColor: "#f8fafc", borderRadius: "8px" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Project Progress Comparison */}
            <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Progress</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Project Comparison</h2>
              </div>
              {adminData.projectProgressComparison.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  No projects yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={adminData.projectProgressComparison}>
                    <XAxis
                      dataKey="projectName"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis label={{ value: "Completion %", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="completionPercent" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Priority Distribution */}
            <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Distribution</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Task Priority</h2>
              </div>
              {adminData.priorityDistribution.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  No data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={adminData.priorityDistribution}>
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Team Workload Distribution */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500\">Team</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900\">Workload Distribution</h2>
            </div>
            {adminData.workloadDistribution.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No team members with tasks.
              </div>
            ) : (
              <div className="space-y-3">
                {adminData.workloadDistribution.map((item, idx) => (
                  <div key={item.employeeId} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/50">
                    <span className="font-medium text-slate-900">{item.employeeName}</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                      style={{ background: PROJECT_COLORS[idx % PROJECT_COLORS.length] + "20", color: PROJECT_COLORS[idx % PROJECT_COLORS.length] }}>
                      {item.taskCount} tasks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Completion Trend */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Trend</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Weekly Completion</h2>
            </div>
            {adminData.completionTrend.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No completion data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={adminData.completionTrend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: "#22c55e", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Activity</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent Updates</h2>
            </div>
            {adminData.recentActivity.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No recent activity.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adminData.recentActivity.map((activity, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/50">
                    <p className="font-medium text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Deadlines</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Upcoming</h2>
            </div>
            {adminData.upcomingDeadlines.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No upcoming deadlines.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adminData.upcomingDeadlines.map((deadline, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/50">
                    <p className="font-medium text-slate-900">{deadline.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-slate-600">
                        {new Date(deadline.dueDate).toLocaleDateString()}
                      </p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                        {deadline.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* EMPLOYEE CHARTS */}
      {!isAdmin && (
        <>
          {/* Personal Task Status Distribution */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Distribution</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Your Task Status</h2>
            </div>
            {employeeData.personalStatusDistribution.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeData.personalStatusDistribution}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {employeeData.personalStatusDistribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Personal Completion Trend */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Trend</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Your Completion Trend</h2>
            </div>
            {employeeData.completionTrend.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No completion data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={employeeData.completionTrend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: "#22c55e", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Personal Deadlines */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Deadlines</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Your Upcoming Deadlines</h2>
            </div>
            {employeeData.deadlines.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No upcoming deadlines.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {employeeData.deadlines.map((deadline, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/50">
                    <p className="font-medium text-slate-900">{deadline.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-slate-600">
                        {new Date(deadline.dueDate).toLocaleDateString()}
                      </p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                        {deadline.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
