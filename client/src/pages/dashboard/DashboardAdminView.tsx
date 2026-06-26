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

  const projectProgress = completionRate;

  return (
    <div className="space-y-6">
      {refreshing && (
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400 animate-pulse">
          Syncing Live Data...
        </div>
      )}

      {/* Extended Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-950 p-8 md:p-10 shadow-[0_24px_50px_rgba(0,0,0,0.6)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(147,51,234,0.08),_transparent_45%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              {getGreeting()}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
              {displayName}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Your ProTrack workspace summary and key task metrics.
            </p>
          </div>
          
          {/* Quick Stats Integration into Hero */}
          <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
            <div className="px-3 border-r border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Progress</p>
              <p className="text-lg font-bold text-emerald-400">{projectProgress}%</p>
            </div>
            <div className="px-3 border-r border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Projects</p>
              <p className="text-lg font-bold text-white">{totalProjects}</p>
            </div>
            <div className="px-3 text-center">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Completion</p>
              <p className="text-lg font-bold text-blue-400">{completionRate}%</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Stats & Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Overview Cards */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="premium-card flex-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace Status</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Active Overview</h3>
              <p className="text-xs text-slate-400 mt-1">Live metrics across the entire board.</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-[#0B0F19] border border-white/5 p-3">
                <span className="text-xs text-slate-400">Active Projects</span>
                <span className="text-sm font-bold text-white">{activeProjects}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#0B0F19] border border-white/5 p-3">
                <span className="text-xs text-slate-400">Completed Projects</span>
                <span className="text-sm font-bold text-emerald-400">{completedProjects}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#0B0F19] border border-white/5 p-3">
                <span className="text-xs text-slate-400">Total Tasks</span>
                <span className="text-sm font-bold text-white">{totalTasks}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Global Progress</h4>
                <p className="text-lg font-bold text-white mt-1">{projectProgress}% Completed</p>
              </div>
              <FolderKanban className="h-5 w-5 text-blue-400" />
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#0B0F19] border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${projectProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              />
            </div>
          </motion.div>
        </div>

        {/* Task Status Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="premium-card lg:col-span-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Task Status Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of current workspace tasks</p>
            </div>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
              {totalTasks} tasks
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-[#0B0F19] border border-dashed border-white/5 px-6 text-center">
              <ListTodo className="h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-white">No tasks available</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 items-center">
              <div className="flex justify-center">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={60}
                        outerRadius={90}
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
                          fontSize: 12,
                          backgroundColor: "#131B2E",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                        }}
                        itemStyle={{ color: "#E2E8F0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2">
                {chartData.map((entry) => (
                  <div
                    key={entry.status}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0B0F19] px-4 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: chartColors[entry.status] }}
                      />
                      <span className="font-semibold text-slate-400">{entry.status}</span>
                    </div>
                    <span className="font-bold text-white">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Activity and Deadlines Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time workspace update feed</p>
            </div>
          </div>

          {stats.recentActivities.length ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {stats.recentActivities.slice(0, 4).map((activity) => {
                const Icon = activityIconMap[activity.type] ?? Activity;
                const tone = activityToneMap[activity.type] ?? "bg-white/5 text-slate-400 border-white/5";
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#0B0F19] p-3 transition-colors hover:border-white/10"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-white">{activity.title}</p>
                        {activity.actorName && (
                          <span className="text-[10px] text-slate-500">by {activity.actorName}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{activity.message}</p>
                      <span className="text-[9px] text-slate-500 block mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-white/5 bg-[#0B0F19] text-center">
              <Activity className="h-8 w-8 text-slate-600" />
              <p className="mt-3 text-xs font-semibold text-white">No activities yet</p>
            </div>
          )}
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="premium-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Upcoming Deadlines</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tasks approaching target date</p>
            </div>
          </div>

          {stats.upcomingDeadlines.length ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {stats.upcomingDeadlines.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-white/5 bg-[#0B0F19] p-3 transition-colors hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{task.title}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{task.projectName}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        task.priority === "High"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : task.priority === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                    <span className="rounded bg-[#131B2E] px-1.5 py-0.5 border border-white/5 text-[9px] text-slate-400">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-white/5 bg-[#0B0F19] text-center">
              <Clock3 className="h-8 w-8 text-slate-600" />
              <p className="mt-3 text-xs font-semibold text-white">All caught up</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">Quick Actions</h3>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, to, desc }) => (
            <motion.button
              key={to}
              variants={fadeUp}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(to)}
              className="premium-card group p-5 text-left flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-xs text-slate-400 mt-1">{desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardAdminView;
