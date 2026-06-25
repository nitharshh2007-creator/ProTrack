import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Kanban,
  ListTodo,
  PlusCircle,
  Activity,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AdminDashboardStats } from "@/types";
import { AnimatedCounter as _AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  activityIconMap,
  activityToneMap,
  chartColors,
  fadeUp,
  getGreeting,
  stagger,
} from "./dashboard.constants";

const quickActions = [
  { label: "Projects", icon: FolderKanban, to: "/projects", desc: "Browse all projects" },
  { label: "Tasks", icon: CheckCircle2, to: "/tasks", desc: "Manage your tasks" },
  { label: "Kanban", icon: Kanban, to: "/kanban", desc: "Visual board view" },
  { label: "Analytics", icon: BarChart2, to: "/analytics", desc: "View reports & metrics" },
];

interface DashboardAdminViewProps {
  stats: AdminDashboardStats;
  displayName: string;
  refreshing: boolean;
}

export const DashboardAdminView = ({ stats, displayName, refreshing }: DashboardAdminViewProps) => {
  const navigate = useNavigate();

  const totalProjects = stats.totalProjects;
  const activeProjects = stats.activeProjects;
  const completedProjects = stats.completedProjects;
  const totalTasks = stats.totalTasks;
  const completionRate = stats.completionRate;
  const chartData = stats.taskStatusDistribution.filter((entry) => entry.count > 0);

  /*
  const _statCards = [
    { label: "Total Projects", value: totalProjects, icon: FolderKanban, color: "blue", secondary: totalProjects > 0 ? "From your workspace" : "No projects yet" },
    { label: "Active Projects", value: activeProjects, icon: Briefcase, color: "cyan", secondary: activeProjects > 0 ? "Currently in progress" : "Waiting to start" },
    { label: "Completed Projects", value: completedProjects, icon: Target, color: "green", secondary: completedProjects > 0 ? "Finished work" : "Nothing completed yet" },
    { label: "Total Tasks", value: totalTasks, icon: ListTodo, color: "indigo", secondary: totalTasks > 0 ? "All workspace tasks" : "No tasks available" },
    { label: "Completed Tasks", value: completedTasks, icon: CheckCircle2, color: "emerald", secondary: `${completionRate}% completion` },
    { label: "Pending Tasks", value: pendingTasks, icon: Clock3, color: "amber", secondary: pendingTasks > 0 ? "Still open" : "All tasks done" },
  ] as const;
  */

  const projectProgress = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  return (
    <div className="space-y-8">
      {refreshing && (
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Refreshing live data...
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-hero px-8 md:px-10 py-12 md:py-14"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_45%)]" />
        <div className="relative space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">{getGreeting()}</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">{displayName}</h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">Manage your workspace, projects, and team activity</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="premium-card"
      >
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Task Status Distribution</h3>
            <p className="mt-1 text-sm text-slate-400">Live breakdown from workspace tasks</p>
          </div>
          <div className="rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-400">
            {totalTasks} tasks
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-[#0B0F19] px-6 text-center">
            <ListTodo className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-base font-semibold text-white">No task data available</p>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Once tasks are created, this chart will show Todo, In Progress, Review, Blocked, and Completed counts.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="flex items-center justify-center">
              <div className="h-[400px] w-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={90}
                      outerRadius={160}
                      paddingAngle={2}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.status} fill={chartColors[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${value} tasks`}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: 13,
                        backgroundColor: "#131B2E",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                      }}
                      itemStyle={{ color: "#E2E8F0" }}
                      labelStyle={{ color: "#94A3B8" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
              {chartData.map((entry) => (
                <div
                  key={entry.status}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#0B0F19] px-5 py-5 transition-all duration-200 hover:border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="h-4 w-4 rounded-full shadow-sm"
                      style={{ backgroundColor: chartColors[entry.status] }}
                    />
                    <span className="text-base font-semibold text-slate-300">{entry.status}</span>
                  </div>
                  <span className="text-xl font-bold text-white">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Project Overview</h3>
              <p className="text-sm text-slate-400">Current workspace summary</p>
            </div>
            <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              {projectProgress}% complete
            </div>
          </div>

          {totalProjects === 0 ? (
            <div className="flex min-h-[290px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-[#0B0F19] px-6 text-center">
              <FolderKanban className="h-10 w-10 text-slate-600" />
              <p className="mt-4 text-base font-semibold text-white">Create your first project</p>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Start tracking progress, tasks, and deadlines across your workspace.
              </p>
              <button
                onClick={() => navigate("/projects/new")}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4" />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-[#0B0F19] border border-white/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">Active Projects</span>
                  <span className="text-lg font-bold text-white">{activeProjects}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-[#0B0F19] border border-white/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">Completed Projects</span>
                  <span className="text-lg font-bold text-white">{completedProjects}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-[#0B0F19] border border-white/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">Total Tasks</span>
                  <span className="text-lg font-bold text-white">{totalTasks}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-[#0B0F19] border border-white/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">Completion Rate</span>
                  <span className="text-lg font-bold text-emerald-400">{completionRate}%</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="premium-card"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              <p className="text-sm text-slate-400">Latest actions across your workspace</p>
            </div>
          </div>

          {stats.recentActivities.length ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => {
                const Icon = activityIconMap[activity.type] ?? Activity;
                const tone = activityToneMap[activity.type] ?? "bg-white/5 text-slate-400 border-white/5";
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#0B0F19] p-4 transition-all duration-200 hover:border-white/10"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{activity.title}</p>
                        {activity.actorName && (
                          <span className="text-xs text-slate-400">by {activity.actorName}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{activity.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                        {activity.projectName && (
                          <span className="rounded-full bg-[#131B2E] px-2 py-0.5 text-slate-300 border border-white/5">
                            {activity.projectName}
                          </span>
                        )}
                        {activity.taskTitle && (
                          <span className="rounded-full bg-[#131B2E] px-2 py-0.5 text-slate-300 border border-white/5">
                            {activity.taskTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-[#0B0F19] px-6 text-center">
              <Activity className="h-10 w-10 text-slate-600" />
              <p className="mt-4 text-base font-semibold text-white">No recent activity yet</p>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                New projects, tasks, comments, and file uploads will appear here automatically.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Upcoming Deadlines</h3>
              <p className="text-sm text-slate-400">Nearest task deadlines first</p>
            </div>
          </div>

          {stats.upcomingDeadlines.length ? (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 transition-all duration-200 hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{task.projectName}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${task.priority === "High"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : task.priority === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                    <span className="rounded-full bg-[#131B2E] px-2 py-0.5 border border-white/5 text-slate-300">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-[#0B0F19] px-6 text-center">
              <Clock3 className="h-10 w-10 text-slate-600" />
              <p className="mt-4 text-base font-semibold text-white">No tasks available</p>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Once tasks are created, the nearest deadlines will appear here.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <div>
        <h3 className="mb-6 text-lg font-bold text-white">Quick Actions</h3>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, to, desc }) => (
            <motion.button
              key={to}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(to)}
              className="premium-card group p-6 text-left"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="premium-icon-container-small">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-400" />
              </div>
              <div>
                <p className="mb-1 font-semibold text-white">{label}</p>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardAdminView;
