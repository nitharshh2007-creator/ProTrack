import { useEffect, useState } from "react";
import { Activity, Clock, Sparkles, FolderKanban, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/store/auth.store";
import { dashboardService } from "@/services";
import type { EmployeeDashboardStats } from "@/types";

const statusColors: Record<string, string> = {
  Todo: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "In Progress": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Review: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Blocked: "bg-red-500/20 text-red-300 border-red-500/30",
  Completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const priorityColors: Record<string, string> = {
  Low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  High: "bg-red-500/20 text-red-400 border-red-500/30",
};

const projectStatusColors: Record<string, string> = {
  Planning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Completed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const isOverdue = (dueDate: string | null | undefined, status: string) => {
  if (!dueDate || status === "Completed") return false;
  return new Date(dueDate) < new Date();
};

export const EmployeeDashboardPage = () => {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<EmployeeDashboardStats | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (hasRole("admin")) {
        navigate("/admin/dashboard");
      }
    }
  }, [hasRole, isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && !hasRole("admin")) {
      setFetchLoading(true);
      setFetchError("");
      dashboardService
        .getStats()
        .then((data) => {
          // The API returns role-specific data — cast to EmployeeDashboardStats
          setStats(data as EmployeeDashboardStats);
        })
        .catch(() => setFetchError("Failed to load dashboard data. Please refresh."))
        .finally(() => setFetchLoading(false));
    }
  }, [isAuthenticated, hasRole]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="text-slate-400 text-sm">Loading your workspace…</span>
      </div>
    );
  }

  if (fetchError || !stats) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-slate-400 text-sm">{fetchError || "No data available."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const openTasks = stats.assignedTasks.filter((t) => t.status !== "Completed");
  const completionPct = Math.round(stats.completionRate ?? 0);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-2xl border border-white/5 bg-[#111827] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Employee Hub</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-50">
              Hi {user?.name?.split(" ")[0] ?? "there"}, ready to move the needle?
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Your personal task board, deadline timeline, and performance snapshot in one workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-[#1A2235] p-5 shadow-sm">
              <p className="text-sm text-slate-400">Assigned Tasks</p>
              <p className="mt-3 text-3xl font-semibold text-[#F8FAFC]">{stats.totalTasks}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#1A2235] p-5 shadow-sm">
              <p className="text-sm text-slate-400">Completed</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-400">{stats.completedTasks}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#1A2235] p-5 shadow-sm">
              <p className="text-sm text-slate-400">Completion Rate</p>
              <p className="mt-3 text-3xl font-semibold text-blue-400">{completionPct}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column */}
        <div className="space-y-6">

          {/* Assigned Projects */}
          <Card>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">My Projects</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Assigned Projects</h2>
              </div>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-400" />
                <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                  {stats.assignedProjectCount}
                </span>
              </div>
            </div>

            {stats.assignedProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No projects assigned yet.</div>
            ) : (
              <div className="space-y-3">
                {stats.assignedProjects.map((project) => (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="group block rounded-2xl border border-white/5 bg-[#1A2235] px-5 py-4 transition hover:bg-[#1A2235]/80 hover:border-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#F8FAFC] truncate">{project.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${projectStatusColors[project.status] ?? "bg-slate-500/20 text-slate-400"}`}>
                          {project.status}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition" />
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Progress</span>
                        <span className="font-bold text-slate-300">{Math.round(project.progress ?? 0)}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-[#0B0F19] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                          style={{ width: `${Math.round(project.progress ?? 0)}%` }}
                        />
                      </div>
                    </div>
                    {project.dueDate && (
                      <p className="mt-2 text-[10px] text-slate-500">
                        Due {formatDate(project.dueDate)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Assigned Tasks */}
          <Card>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Assigned Tasks</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Your Sprint Work</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                {openTasks.length} open
              </span>
            </div>

            {stats.assignedTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No tasks assigned yet.</div>
            ) : (
              <div className="space-y-3">
                {stats.assignedTasks.map((task) => (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    className="group block rounded-2xl border border-white/5 bg-[#1A2235] px-5 py-4 transition hover:bg-[#1A2235]/80 hover:border-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#F8FAFC] truncate">{task.title}</p>
                        {task.projectName && (
                          <p className="mt-0.5 text-[10px] text-slate-500 truncate">{task.projectName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColors[task.status] ?? ""}`}>
                          {task.status}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityColors[task.priority] ?? ""}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className={`text-[10px] font-medium ${isOverdue(task.dueDate, task.status) ? "text-red-400" : "text-slate-500"}`}>
                        {task.dueDate
                          ? (isOverdue(task.dueDate, task.status) ? "Overdue · " : "Due ") + formatDate(task.dueDate)
                          : "No due date"}
                      </p>
                      <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-blue-400 transition" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/5">
              <Link
                to="/tasks"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-4 py-2 text-xs font-bold text-blue-400 transition"
              >
                View All Tasks
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Completion Stats */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Performance</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Completion</h2>
              </div>
              <Sparkles className="h-6 w-6 text-fuchsia-400" />
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#1A2235] p-6 text-center shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Rate</p>
              <p className="mt-4 text-5xl font-semibold text-[#F8FAFC]">{completionPct}%</p>
              <p className="mt-3 text-sm text-slate-400">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </p>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#1A2235] px-4 py-3 text-sm text-[#CBD5E1] shadow-sm">
                <span>Open Tasks</span>
                <span className="font-semibold text-amber-400">{stats.pendingTasks}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#1A2235] px-4 py-3 text-sm text-[#CBD5E1]">
                <span>Projects</span>
                <span className="font-semibold text-blue-400">{stats.assignedProjectCount}</span>
              </div>
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Upcoming Deadlines</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Next Milestones</h2>
              </div>
              <Clock className="h-5 w-5 text-slate-300" />
            </div>
            <div className="mt-5 space-y-3">
              {stats.upcomingDeadlines.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  No upcoming deadlines
                </div>
              ) : (
                stats.upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                      isOverdue(item.dueDate, item.status)
                        ? "bg-red-500/5 border-red-500/20 text-red-300"
                        : "bg-[#1A2235] border-white/5 text-[#CBD5E1]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-[#F8FAFC]">{item.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{item.projectName}</p>
                    </div>
                    <span className={`ml-3 shrink-0 font-semibold text-xs ${isOverdue(item.dueDate, item.status) ? "text-red-400" : "text-[#F8FAFC]"}`}>
                      {formatDate(item.dueDate)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Recent Activity</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Latest Updates</h2>
              </div>
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                Live
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {stats.recentActivities.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No recent activity.</div>
              ) : (
                stats.recentActivities.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/5 bg-[#1A2235] px-4 py-3 text-sm text-[#CBD5E1] transition hover:border-white/10">
                    <div className="flex items-start gap-3">
                      <Activity className="h-4 w-4 text-fuchsia-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-300 text-xs">{item.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
