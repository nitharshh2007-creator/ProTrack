import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Kanban,
  ListTodo,
  Activity,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type { EmployeeDashboardStats } from "@/types";
import {
  activityIconMap,
  activityToneMap,
  fadeUp,
  stagger,
} from "./dashboard.constants";

const quickActions = [
  { label: "Projects", icon: FolderKanban, to: "/projects", desc: "View assigned projects" },
  { label: "Tasks", icon: CheckCircle2, to: "/tasks", desc: "Manage your tasks" },
  { label: "Kanban", icon: Kanban, to: "/kanban", desc: "Visual board view" },
];

interface DashboardEmployeeViewProps {
  stats: EmployeeDashboardStats;
  displayName: string;
  refreshing: boolean;
}

const priorityColor = (priority: string) => {
  if (priority === "High") return "from-red-500 to-rose-600";
  if (priority === "Medium") return "from-amber-500 to-orange-600";
  return "from-emerald-500 to-green-600";
};

const statusColor = (status: string) => {
  if (status === "Completed") return "from-emerald-500 to-green-600";
  if (status === "In Progress") return "from-blue-500 to-cyan-600";
  if (status === "Blocked") return "from-red-500 to-rose-600";
  if (status === "Review") return "from-amber-500 to-orange-600";
  return "from-slate-500 to-slate-600";
};

export const DashboardEmployeeView = ({ stats, displayName, refreshing }: DashboardEmployeeViewProps) => {
  const navigate = useNavigate();
  const assignedProjects = stats.assignedProjects;
  const assignedTasks = stats.assignedTasks;

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
          <p className="text-xs uppercase tracking-[0.3em] text-gray-600 dark:text-slate-400">Welcome back</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
          <p className="text-sm text-gray-700 dark:text-slate-400">Your personal overview of assigned projects and tasks</p>
        </div>
      </motion.div>

      {/* MY PROJECTS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Projects</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Projects you are assigned to</p>
        </div>

        {assignedProjects.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 text-center">
            <FolderKanban className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">No projects assigned yet</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              When a manager adds you to a project, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {assignedProjects.map((project, idx) => (
              <motion.button
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(37,99,235,0.15)" }}
                onClick={() => navigate(`/projects/${project._id}`)}
                className="group relative overflow-hidden rounded-[24px] border border-white/20 dark:border-slate-800 bg-gradient-to-br from-white/90 via-slate-50/80 to-white/70 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/70 p-6 shadow-lg backdrop-blur-[20px] text-left transition-all"
              >
                {/* Cover banner */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 transition-opacity group-hover:opacity-75" />

                <div className="relative space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{project.title}</h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{project.description}</p>
                    </div>
                    <div className={`shrink-0 rounded-xl bg-gradient-to-br ${statusColor(project.status)} px-3 py-1.5 text-xs font-semibold text-white shadow-lg`}>
                      {project.status}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{project.progress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/50 dark:bg-slate-700/50 backdrop-blur-sm">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    {project.deadline && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(project.deadline), "MMM d")}</span>
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* MY TASKS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Tasks</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tasks assigned to you</p>
        </div>

        {assignedTasks.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 text-center">
            <ListTodo className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">No tasks assigned yet</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Your assigned tasks will show up here once a manager assigns them to you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedTasks.map((task, idx) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ x: 4, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                className="group relative overflow-hidden rounded-[16px] border border-white/30 dark:border-slate-700/50 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 p-4 shadow-md backdrop-blur-[10px] transition-all"
              >
                {/* Priority left border */}
                <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${priorityColor(task.priority)}`} />

                <div className="pl-2">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">{task.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{task.projectName}</p>
                    </div>
                    <div className={`shrink-0 rounded-lg bg-gradient-to-br ${priorityColor(task.priority)} px-2.5 py-1 text-xs font-bold text-white shadow-md`}>
                      {task.priority}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`rounded-full bg-gradient-to-r ${statusColor(task.status)} px-2.5 py-1 text-xs font-semibold text-white shadow-sm`}>
                      {task.status}
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 rounded-full bg-white/50 dark:bg-slate-700/50 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.dueDate), "MMM d")}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* MY ACTIVITY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Activity</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Updates on your projects and tasks</p>
          </div>

          {stats.recentActivities.length ? (
            <div className="space-y-2">
              {stats.recentActivities.map((activity, idx) => {
                const Icon = activityIconMap[activity.type] ?? Activity;
                const tone = activityToneMap[activity.type] ?? "from-slate-500 to-slate-600";
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative overflow-hidden rounded-[16px] border border-white/30 dark:border-slate-700/50 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 p-4 shadow-md backdrop-blur-[10px] transition-all hover:shadow-lg"
                  >
                    {/* Timeline line */}
                    <div className="absolute left-6 top-full h-8 w-0.5 bg-gradient-to-b from-slate-300 to-transparent opacity-0 group-last:opacity-0" />

                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-md`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{activity.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{activity.message}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                          {activity.projectName && (
                            <span className="rounded-full bg-white/60 dark:bg-slate-700/60 px-2 py-0.5 text-slate-700 dark:text-slate-300 font-medium shadow-sm">
                              {activity.projectName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 text-center">
              <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">No activity yet</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Activity on your assigned projects and tasks will appear here.
              </p>
            </div>
          )}
        </motion.div>

        {/* MY DEADLINES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Deadlines</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your upcoming task due dates</p>
          </div>

          {stats.upcomingDeadlines.length ? (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((task, idx) => {
                const dueDate = new Date(task.dueDate);
                const now = new Date();
                const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysLeft < 0;
                const isUrgent = daysLeft <= 3;

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -2, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                    className={`relative overflow-hidden rounded-[16px] border p-4 shadow-md backdrop-blur-[10px] transition-all ${
                      isOverdue
                        ? "border-red-200/50 dark:border-red-900/50 bg-gradient-to-r from-red-50/80 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/20"
                        : isUrgent
                        ? "border-amber-200/50 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20"
                        : "border-white/30 dark:border-slate-700/50 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{task.projectName}</p>
                      </div>
                      <div className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-md ${
                        isOverdue
                          ? "bg-gradient-to-br from-red-500 to-rose-600"
                          : isUrgent
                          ? "bg-gradient-to-br from-amber-500 to-orange-600"
                          : "bg-gradient-to-br from-blue-500 to-cyan-600"
                      }`}>
                        {task.priority}
                      </div>
                    </div>

                    {/* Countdown indicator */}
                    <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      isOverdue
                        ? "bg-red-100 text-red-700"
                        : isUrgent
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      <Clock3 className="h-4 w-4" />
                      {isOverdue ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue` : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${
                        isOverdue
                          ? "bg-gradient-to-r from-red-500 to-rose-600"
                          : isUrgent
                          ? "bg-gradient-to-r from-amber-500 to-orange-600"
                          : "bg-gradient-to-r from-slate-500 to-slate-600"
                      }`}>
                        {task.status}
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{format(dueDate, "MMM d, yyyy")}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 text-center">
              <Clock3 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">No upcoming deadlines</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Deadlines for your assigned tasks will appear here, sorted by nearest date.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-slate-100">Quick Actions</h3>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {quickActions.map(({ label, icon: Icon, to, desc }) => (
            <motion.button
              key={to}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 40px rgba(37,99,235,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(to)}
              className="group relative overflow-hidden rounded-[20px] border border-white/30 dark:border-slate-700/50 bg-gradient-to-br from-white/90 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/70 p-6 shadow-lg backdrop-blur-[20px] text-left transition-all hover:border-white/50 dark:hover:border-slate-600/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 opacity-0 group-hover:opacity-5 transition-opacity" />
              
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-600 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardEmployeeView;
