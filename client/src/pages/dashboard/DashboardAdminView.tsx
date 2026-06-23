import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  BarChart2,
  Briefcase,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Kanban,
  ListTodo,
  PlusCircle,
  Target,
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
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
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
  const completedTasks = stats.completedTasks;
  const pendingTasks = stats.pendingTasks;
  const completionRate = stats.completionRate;
  const chartData = stats.taskStatusDistribution.filter((entry) => entry.count > 0);

  const statCards = [
    { label: "Total Projects", value: totalProjects, icon: FolderKanban, color: "blue", secondary: totalProjects > 0 ? "From your workspace" : "No projects yet" },
    { label: "Active Projects", value: activeProjects, icon: Briefcase, color: "cyan", secondary: activeProjects > 0 ? "Currently in progress" : "Waiting to start" },
    { label: "Completed Projects", value: completedProjects, icon: Target, color: "green", secondary: completedProjects > 0 ? "Finished work" : "Nothing completed yet" },
    { label: "Total Tasks", value: totalTasks, icon: ListTodo, color: "indigo", secondary: totalTasks > 0 ? "All workspace tasks" : "No tasks available" },
    { label: "Completed Tasks", value: completedTasks, icon: CheckCircle2, color: "emerald", secondary: `${completionRate}% completion` },
    { label: "Pending Tasks", value: pendingTasks, icon: Clock3, color: "amber", secondary: pendingTasks > 0 ? "Still open" : "All tasks done" },
  ] as const;

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
        className="relative overflow-hidden rounded-[24px] border border-gray-200 dark:border-white/10 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-[#101728] px-8 py-12 shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.10),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-600 dark:text-slate-400">{getGreeting()}</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
          <p className="text-sm text-gray-700 dark:text-slate-400">Manage your workspace, projects, and team activity</p>
        </div>
      </motion.div>



      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="premium-white-card rounded-[24px] p-8"
      >
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Task Status Distribution</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live breakdown from workspace tasks</p>
          </div>
          <div className="rounded-full bg-blue-50 dark:bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
            {totalTasks} tasks
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 text-center">
            <ListTodo className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">No task data available</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Once tasks are created, this chart will show Todo, In Progress, Review, Blocked, and Completed counts.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="flex items-center justify-center">
              <div className="h-[450px] w-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={110}
                      outerRadius={180}
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
                        border: "1px solid #E2E8F0",
                        fontSize: 13,
                        backgroundColor: "#ffffff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
              {chartData.map((entry) => (
                <div
                  key={entry.status}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 px-5 py-5 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="h-4 w-4 rounded-full shadow-sm"
                      style={{ backgroundColor: chartColors[entry.status] }}
                    />
                    <span className="text-base font-semibold text-slate-700 dark:text-slate-300">{entry.status}</span>
                  </div>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{entry.count}</span>
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
          className="premium-white-card rounded-[24px] p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Project Overview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Current workspace summary</p>
            </div>
            <div className="rounded-full bg-emerald-50 dark:bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {projectProgress}% complete
            </div>
          </div>

          {totalProjects === 0 ? (
            <div className="flex min-h-[290px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 text-center">
              <FolderKanban className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">Create your first project</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
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
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Active Projects</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activeProjects}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Completed Projects</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{completedProjects}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Tasks</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{totalTasks}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{completionRate}%</span>
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
          className="premium-white-card rounded-[24px] p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Activity</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest actions across your workspace</p>
            </div>
          </div>

          {stats.recentActivities.length ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => {
                const Icon = activityIconMap[activity.type] ?? Activity;
                const tone = activityToneMap[activity.type] ?? "bg-slate-500/10 text-slate-600 border-slate-500/20";
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-4 transition-shadow hover:shadow-sm"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{activity.title}</p>
                        {activity.actorName && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">by {activity.actorName}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{activity.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                        {activity.projectName && (
                          <span className="rounded-full bg-white dark:bg-slate-700 px-2 py-1 text-slate-600 dark:text-slate-300 shadow-sm">
                            {activity.projectName}
                          </span>
                        )}
                        {activity.taskTitle && (
                          <span className="rounded-full bg-white dark:bg-slate-700 px-2 py-1 text-slate-600 dark:text-slate-300 shadow-sm">
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
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 text-center">
              <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">No recent activity yet</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                New projects, tasks, comments, and file uploads will appear here automatically.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-white-card rounded-[24px] p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Upcoming Deadlines</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nearest task deadlines first</p>
            </div>
          </div>

          {stats.upcomingDeadlines.length ? (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.projectName}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${task.priority === "High"
                        ? "bg-red-500/10 text-red-700 dark:text-red-400"
                        : task.priority === "Medium"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                    <span className="rounded-full bg-white dark:bg-slate-700 px-2 py-1 shadow-sm">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 text-center">
              <Clock3 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">No tasks available</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Once tasks are created, the nearest deadlines will appear here.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <div>
        <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-slate-100">Quick Actions</h3>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, to, desc }) => (
            <motion.button
              key={to}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(to)}
              className="premium-action-card group rounded-[20px] p-6 text-left"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="premium-icon-container-small">
                  <Icon className="h-5 w-5 text-blue-500" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500" />
              </div>
              <div>
                <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardAdminView;
