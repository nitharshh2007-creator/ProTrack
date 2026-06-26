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
              Welcome Back
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
              {displayName}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Your personal workspace overview, assigned projects, and task deadlines.
            </p>
          </div>
          
          {/* Quick Stats Integration into Hero */}
          <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
            <div className="px-3 border-r border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Projects</p>
              <p className="text-lg font-bold text-blue-400">{assignedProjects.length}</p>
            </div>
            <div className="px-3 text-center">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">My Tasks</p>
              <p className="text-lg font-bold text-white">{assignedTasks.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Projects and Tasks grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Projects */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">My Projects</h3>
            <p className="text-xs text-slate-400 mt-0.5">Projects you are actively assigned to</p>
          </div>

          {assignedProjects.length === 0 ? (
            <div className="premium-empty-state min-h-[220px]">
              <FolderKanban className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-white">No assigned projects yet</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {assignedProjects.map((project, idx) => (
                <motion.button
                  key={project._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -3 }}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className="premium-card relative overflow-hidden text-left p-5 flex flex-col justify-between min-h-[140px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white truncate flex-1">{project.title}</h4>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold text-white bg-gradient-to-r ${statusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Progress</span>
                      <span className="font-bold text-white">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#0B0F19]">
                      <div
                        style={{ width: `${project.progress}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* My Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">My Tasks</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tasks currently assigned to you</p>
          </div>

          {assignedTasks.length === 0 ? (
            <div className="premium-empty-state min-h-[220px]">
              <ListTodo className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-white">No tasks assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {assignedTasks.map((task, idx) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="premium-card relative overflow-hidden p-4"
                >
                  <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${priorityColor(task.priority)}`} />
                  <div className="pl-2">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-xs truncate">{task.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{task.projectName}</p>
                      </div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold text-white bg-gradient-to-r ${priorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold text-white bg-gradient-to-r ${statusColor(task.status)}`}>
                        {task.status}
                      </span>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[9px] text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(task.dueDate), "MMM d")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Activity and Deadlines */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* My Activity */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">My Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Updates on assigned projects and tasks</p>
          </div>

          {stats.recentActivities.length ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {stats.recentActivities.map((activity, idx) => {
                const Icon = activityIconMap[activity.type] ?? Activity;
                const tone = activityToneMap[activity.type] ?? "from-slate-500 to-slate-600";
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="premium-card p-4"
                  >
                    <div className="flex gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tone} text-white`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white text-xs">{activity.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{activity.message}</p>
                        <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-500">
                          <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                          {activity.projectName && (
                            <span className="rounded bg-white/5 border border-white/5 px-1 py-0.5 text-slate-400">
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
            <div className="premium-empty-state min-h-[200px]">
              <Activity className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-white">No activity yet</p>
            </div>
          )}
        </motion.div>

        {/* My Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">My Deadlines</h3>
            <p className="text-xs text-slate-400 mt-0.5">Your upcoming task deadlines</p>
          </div>

          {stats.upcomingDeadlines.length ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
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
                    className={`premium-card p-4 ${
                      isOverdue
                        ? "border-red-500/30 bg-red-950/20"
                        : isUrgent
                        ? "border-amber-500/30 bg-amber-950/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-xs truncate">{task.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{task.projectName}</p>
                      </div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold text-white bg-gradient-to-br ${
                        isOverdue
                          ? "from-red-500 to-rose-600"
                          : isUrgent
                          ? "from-amber-500 to-orange-600"
                          : "from-blue-500 to-cyan-600"
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className={`mb-2.5 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold ${
                      isOverdue
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : isUrgent
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>
                        {isOverdue ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue` : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`rounded-full px-2 py-0.5 font-semibold text-white bg-gradient-to-r ${statusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="text-slate-400">{format(dueDate, "MMM d, yyyy")}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="premium-empty-state min-h-[200px]">
              <Clock3 className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-white">No upcoming deadlines</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">Quick Actions</h3>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
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

export default DashboardEmployeeView;
