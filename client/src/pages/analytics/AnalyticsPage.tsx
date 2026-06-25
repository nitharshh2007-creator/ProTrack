import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid
} from "recharts";
import { analyticsService, type AnalyticsData, type AnalyticsDataAdmin, type AnalyticsDataEmployee } from "@/services";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/auth.store";
import { getSocket } from "@/lib/socket";
import { Clock, Calendar, AlertCircle, Activity } from "lucide-react";


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
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-slate-700/50" style={{ borderTop: `4px solid ${color}` }}>
    <p className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-3">{label}</p>
    <p className="text-3xl font-bold text-slate-50 mb-2">{value}</p>
    {description && <p className="text-sm text-slate-400">{description}</p>}
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
      <div className="premium-hero">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_45%)]" />
        <div className="relative space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">
            {isAdmin ? "Workspace" : "Personal"}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
            {isAdmin ? "Analytics Dashboard" : "My Analytics"}
          </h1>
          <p className="text-sm md:text-base text-[#CBD5E1] max-w-2xl leading-relaxed">
            {isAdmin
              ? "Track project performance, task completion and team productivity."
              : "Track your assigned projects and task performance."}
          </p>
        </div>
      </div>

      {/* PROJECT FILTER (ADMIN ONLY) */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <label className="text-sm font-semibold text-slate-350 mb-3 block uppercase tracking-wider">
            Filter by Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full md:w-64 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 outline-none transition hover:bg-slate-900 focus:ring-2 focus:ring-slate-800"
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
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Distribution</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-100">Task Status</h2>
            </div>
            {adminData.statusDistribution.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
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
                      label={({ status, percent }: any) =>
                        `${status} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {adminData.statusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} tasks`, "Tasks"]}
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Project Progress Comparison */}
            <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Progress</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-100">Project Comparison</h2>
              </div>
              {adminData.projectProgressComparison.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                  No projects yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={adminData.projectProgressComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="projectName"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: "#94a3b8" }} label={{ value: "Completion %", angle: -90, position: "insideLeft", fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }} />
                    <Bar dataKey="completionPercent" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Priority Distribution */}
            <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Distribution</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-100">Task Priority</h2>
              </div>
              {adminData.priorityDistribution.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                  No data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={adminData.priorityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="priority" tick={{ fill: "#94a3b8" }} />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Team Workload Distribution */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Team</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-100">Workload Distribution</h2>
            </div>
            {adminData.workloadDistribution.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                No team members with tasks.
              </div>
            ) : (
              <div className="space-y-3">
                {adminData.workloadDistribution.map((item, idx) => (
                  <div key={item.employeeId} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-850">
                    <span className="font-medium text-slate-200">{item.employeeName}</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border"
                      style={{ background: PROJECT_COLORS[idx % PROJECT_COLORS.length] + "15", color: PROJECT_COLORS[idx % PROJECT_COLORS.length], borderColor: PROJECT_COLORS[idx % PROJECT_COLORS.length] + "30" }}>
                      {item.taskCount} tasks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Completion Trend */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Trend</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-100">Weekly Completion</h2>
            </div>
            {adminData.completionTrend.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                No completion data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={adminData.completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
                  <YAxis tick={{ fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ fill: "#22c55e", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Activity</p>
                <h2 className="mt-2 text-xl font-bold text-slate-100">Recent Updates</h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            {adminData.recentActivity.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                No recent activity.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {adminData.recentActivity.map((activity, idx) => (
                  <div key={idx} className="group bg-slate-950/40 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-800 transition-all duration-300 p-4 rounded-xl flex items-start gap-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-200 group-hover:text-white transition-colors text-sm leading-relaxed">{activity.description}</p>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Deadlines</p>
                <h2 className="mt-2 text-xl font-bold text-slate-100">Upcoming</h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            {adminData.upcomingDeadlines.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                No upcoming deadlines.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {adminData.upcomingDeadlines.map((deadline, idx) => {
                  const diffTime = new Date(deadline.dueDate).getTime() - new Date().getTime();
                  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return (
                    <div key={idx} className="group bg-slate-950/40 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-800 transition-all duration-300 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 group-hover:text-white transition-colors text-sm truncate">{deadline.title}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5 font-mono">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(deadline.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {days < 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-red-950/30 text-red-400 border border-red-900/30">Overdue</span>
                        ) : days === 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-950/30 text-amber-400 border border-amber-900/30">Today</span>
                        ) : days === 1 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-950/30 text-amber-400 border border-amber-900/30">Tomorrow</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">{days}d left</span>
                        )}
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-950/40 text-blue-400 border border-blue-900/35">
                          {deadline.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* EMPLOYEE CHARTS */}
      {!isAdmin && (
        <>
          {/* Personal Task Status Distribution */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Distribution</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-100">Your Task Status</h2>
            </div>
            {employeeData.personalStatusDistribution.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                No data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeData.personalStatusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="status" tick={{ fill: "#94a3b8" }} />
                  <YAxis tick={{ fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }} />
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
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Trend</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-100">Your Completion Trend</h2>
            </div>
            {employeeData.completionTrend.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                No completion data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={employeeData.completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
                  <YAxis tick={{ fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ fill: "#22c55e", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Personal Deadlines */}
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Deadlines</p>
                <h2 className="mt-2 text-xl font-bold text-slate-100">Your Upcoming Deadlines</h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            {employeeData.deadlines.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">
                No upcoming deadlines.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {employeeData.deadlines.map((deadline, idx) => {
                  const diffTime = new Date(deadline.dueDate).getTime() - new Date().getTime();
                  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return (
                    <div key={idx} className="group bg-slate-950/40 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-800 transition-all duration-300 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 group-hover:text-white transition-colors text-sm truncate">{deadline.title}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5 font-mono">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(deadline.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {days < 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-red-950/30 text-red-400 border border-red-900/30">Overdue</span>
                        ) : days === 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-950/30 text-amber-400 border border-amber-900/30">Today</span>
                        ) : days === 1 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-950/30 text-amber-400 border border-amber-900/30">Tomorrow</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">{days}d left</span>
                        )}
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-950/40 text-blue-400 border border-blue-900/35">
                          {deadline.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
