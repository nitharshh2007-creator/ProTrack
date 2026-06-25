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
        className="premium-hero px-8 md:px-10 py-12 md:py-14"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_45%)]" />
        <div className="relative space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">Welcome back</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">{displayName}</h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">Your personal overview of assigned projects and tasks</p>
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
          <h3 className="text-lg font-bold text-white">My Projects</h3>
          <p className="text-sm text-slate-400">Projects you are assigned to</p>
        </div>

        {assignedProjects.length === 0 ? (
          <div className="premium-empty-state">
            <FolderKanban className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-base font-semibold text-white">No projects assigned yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
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
                whileHover={{ y: -6 }}
                onClick={() => navigate(`/projects/${project._id}`)}
                className="premium-card relative overflow-hidden text-left transition-all duration-200"
              >
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                <div className="relative space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white line-clamp-1">{project.title}</h4>
                      <p className="mt-1 text-sm text-slate-400 line-clamp-2">{project.description}</p>
                    </div>
                    <div className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-white bg-gradient-to-r ${statusColor(project.status)}`}>
                      {project.status}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-400">Progress</span>
                      <span className="font-bold text-white">{project.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#0B0F19]">
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
                    {project.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(project.dueDate), "MMM d")}</span>
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-500" />
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
          <h3 className="text-lg font-bold text-white">My Tasks</h3>
          <p className="text-sm text-slate-400">Tasks assigned to you</p>
        </div>

        {assignedTasks.length === 0 ? (
          <div className="premium-empty-state">
            <ListTodo className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-base font-semibold text-white">No tasks assigned yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
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
                whileHover={{ x: 4 }}
                className="premium-card relative overflow-hidden transition-all duration-200"
              >
                {/* Priority left border */}
                <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${priorityColor(task.priority)}`} />

                <div className="pl-2">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-base">{task.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{task.projectName}</p>
                    </div>
                    <div className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r ${priorityColor(task.priority)}`}>
                      {task.priority}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white bg-gradient-to-r ${statusColor(task.status)}`}>
                      {task.status}
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300 font-medium">
                        <Calendar className="h-3 w-3 text-slate-400" />
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
            <h3 className="text-lg font-bold text-white">My Activity</h3>
            <p className="text-sm text-slate-400">Updates on your projects and tasks</p>
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
                    className="premium-card relative overflow-hidden transition-all duration-200"
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{activity.title}</p>
                        <p className="mt-0.5 text-sm text-slate-300">{activity.message}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                          {activity.projectName && (
                            <span className="rounded-full bg-white/5 border border-white/5 px-2 py-0.5 text-slate-300 font-medium">
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
            <div className="premium-empty-state">
              <Activity className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-base font-semibold text-white">No activity yet</p>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
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
            <h3 className="text-lg font-bold text-white">My Deadlines</h3>
            <p className="text-sm text-slate-400">Your upcoming task due dates</p>
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
                    whileHover={{ y: -2 }}
                    className={`premium-card relative overflow-hidden transition-all duration-200 ${
                      isOverdue
                        ? "border-red-500/30 bg-red-950/20"
                        : isUrgent
                        ? "border-amber-500/30 bg-amber-950/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{task.title}</p>
                        <p className="mt-0.5 text-sm text-slate-400">{task.projectName}</p>
                      </div>
                      <div className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-br ${
                        isOverdue
                          ? "from-red-500 to-rose-600"
                          : isUrgent
                          ? "from-amber-500 to-orange-600"
                          : "from-blue-500 to-cyan-600"
                      }`}>
                        {task.priority}
                      </div>
                    </div>

                    {/* Countdown indicator */}
                    <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                      isOverdue
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : isUrgent
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      <Clock3 className="h-4 w-4" />
                      {isOverdue ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue` : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white bg-gradient-to-r ${
                        isOverdue
                          ? "from-red-500 to-rose-600"
                          : isUrgent
                          ? "from-amber-500 to-orange-600"
                          : "from-slate-500 to-slate-600"
                      }`}>
                        {task.status}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{format(dueDate, "MMM d, yyyy")}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="premium-empty-state">
              <Clock3 className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-base font-semibold text-white">No upcoming deadlines</p>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Deadlines for your assigned tasks will appear here, sorted by nearest date.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-6 text-lg font-bold text-white">Quick Actions</h3>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {quickActions.map(({ label, icon: Icon, to, desc }) => (
            <motion.button
              key={to}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(to)}
              className="premium-card group relative overflow-hidden text-left transition-all duration-200"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{label}</p>
                  <p className="mt-1 text-sm text-slate-400">{desc}</p>
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
