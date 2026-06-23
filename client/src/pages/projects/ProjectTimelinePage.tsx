import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { projectService } from "@/services";
import type { TimelineItem, TimelineProject } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/formatDate";
import { 
  Calendar, AlertCircle, Plus, CheckCircle2, Circle, Clock, Flag, 
  ClipboardList, Clock3, ArrowLeft, Users, Target, Calendar as CalendarIcon
} from "lucide-react";

type ViewMode = "day" | "week" | "month";
type TimelineItemWithFallbackDates = TimelineItem & {
  startDate?: string;
  dueDate?: string;
};
type NormalizedTimelineItem = TimelineItemWithFallbackDates & {
  start: string;
  end: string;
};

const STATUS_BAR: Record<string, string> = {
  Todo:          "bg-slate-400",
  "In Progress": "bg-blue-500",
  Review:        "bg-amber-500",
  Blocked:       "bg-red-500",
  Completed:     "bg-emerald-500",
};

const STATUS_BADGE: Record<string, "default" | "info" | "warning" | "danger" | "success"> = {
  Todo:          "default",
  "In Progress": "info",
  Review:        "warning",
  Blocked:       "danger",
  Completed:     "success",
};

const PRIORITY_BADGE: Record<string, "default" | "warning" | "danger"> = {
  Low:    "default",
  Medium: "warning",
  High:   "danger",
};

const VIEW_LABELS: Record<ViewMode, string> = {
  day:   "Day",
  week:  "Week",
  month: "Month",
};

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
const diffDays = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const formatAxisDate = (d: Date, mode: ViewMode): string => {
  if (mode === "day")   return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  if (mode === "week")  return `W${getISOWeek(d)} ${MONTH_NAMES[d.getMonth()]}`;
  return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
};

const getISOWeek = (d: Date): number => {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
};

const columnDays = (mode: ViewMode): number =>
  mode === "day" ? 1 : mode === "week" ? 7 : 30;

const COL_WIDTH_PX = 56;

const ProjectHeader = ({
  project,
  onBack,
  totalTasks,
}: {
  project: TimelineProject;
  onBack: string;
  totalTasks: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#101728] p-8 shadow-xl"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
    
    <div className="relative">
      <Link 
        to={onBack} 
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>
      
      <div className="space-y-2 mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Project</p>
        <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold text-white mb-3">{project.title}</h1>
          {project.description && (
            <p className="text-lg text-white/80 leading-relaxed line-clamp-2">{project.description}</p>
          )}
          
          {/* Progress Section */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-white/80">Project Progress</span>
              <span className="text-2xl font-bold text-white">{project.progress}%</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-white/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 shadow-lg"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Status & Priority */}
          <div className="flex flex-wrap gap-3">
            <Badge 
              variant={STATUS_BADGE[project.status] ?? "default"}
            >
              {project.status}
            </Badge>
            <Badge 
              variant={PRIORITY_BADGE[project.priority] ?? "default"}
            >
              {project.priority} Priority
            </Badge>
          </div>
        </div>
      </div>
      </div>
    </div>
  </motion.div>
);

const TaskPanel = ({
  task,
  onClose,
}: {
  task: TimelineItem;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ x: 400, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 400, opacity: 0 }}
    className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl sm:w-96"
  >
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-900">Task Details</h2>
      <button
        onClick={onClose}
        className="rounded p-1 text-slate-400 hover:bg-slate-100"
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Task</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{task.name}</p>
      </div>
      {task.description && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</p>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{task.description}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
          <div className="mt-2">
            <Badge variant={STATUS_BADGE[task.status] ?? "default"}>{task.status}</Badge>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority</p>
          <div className="mt-2">
            <Badge variant={PRIORITY_BADGE[task.priority] ?? "default"}>{task.priority}</Badge>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assignee</p>
          <p className="mt-2 text-sm font-medium text-slate-700">{task.assignedTo?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Progress</p>
          <p className="mt-2 text-sm font-bold text-blue-600">{task.progress}%</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Start Date</p>
          <p className="mt-2 text-sm font-medium text-slate-700">{formatDate(task.start)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Due Date</p>
          <p className="mt-2 text-sm font-medium text-slate-700">{formatDate(task.end)}</p>
        </div>
      </div>
      {task.start && task.end && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Duration</p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {Math.max(1, diffDays(new Date(task.start), new Date(task.end)))} day(s)
          </p>
        </div>
      )}
    </div>
  </motion.div>
);

const SummaryCards = ({ tasks }: { tasks: TimelineItem[] }) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "Completed").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    blocked: tasks.filter((t) => t.status === "Blocked").length,
  };

  const cards = [
    { 
      label: "TOTAL TASKS", 
      value: stats.total, 
      borderColor: "#3B82F6",
      icon: ClipboardList,
      iconBg: "linear-gradient(135deg, #60A5FA, #2563EB)"
    },
    { 
      label: "COMPLETED", 
      value: stats.completed, 
      borderColor: "#22C55E",
      icon: CheckCircle2,
      iconBg: "linear-gradient(135deg, #4ADE80, #16A34A)"
    },
    { 
      label: "IN PROGRESS", 
      value: stats.inProgress, 
      borderColor: "#0EA5E9",
      icon: Clock3,
      iconBg: "linear-gradient(135deg, #38BDF8, #0284C7)"
    },
    { 
      label: "BLOCKED", 
      value: stats.blocked, 
      borderColor: "#F43F5E",
      icon: AlertCircle,
      iconBg: "linear-gradient(135deg, #FB7185, #E11D48)"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid gap-6 grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="group relative overflow-hidden rounded-[22px] bg-white transition-all duration-300 hover:-translate-y-1"
            style={{
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)'
            }}
          >
            {/* Top accent border */}
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: card.borderColor }}
            />
            
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              </div>
              
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

const TaskStats = ({ tasks }: { tasks: TimelineItem[] }) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "Completed").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    blocked: tasks.filter((t) => t.status === "Blocked").length,
    review: tasks.filter((t) => t.status === "Review").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-lg"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Task Status</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200/30">
          <span className="text-sm text-slate-600">Total</span>
          <span className="font-semibold text-slate-900">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3 border border-emerald-200/30">
          <span className="text-sm text-emerald-700">Completed</span>
          <span className="font-semibold text-emerald-700">{stats.completed}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 border border-blue-200/30">
          <span className="text-sm text-blue-700">In Progress</span>
          <span className="font-semibold text-blue-700">{stats.inProgress}</span>
        </div>
        {stats.review > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 border border-amber-200/30">
            <span className="text-sm text-amber-700">Review</span>
            <span className="font-semibold text-amber-700">{stats.review}</span>
          </div>
        )}
        {stats.blocked > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-red-50 p-3 border border-red-200/30">
            <span className="text-sm text-red-700">Blocked</span>
            <span className="font-semibold text-red-700">{stats.blocked}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};;

const UpcomingDeadlines = ({ tasks }: { tasks: TimelineItem[] }) => {
  const upcoming = tasks
    .map((t) => ({
      ...t,
      daysLeft: Math.ceil(
        (new Date(t.end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))
    .filter((t) => t.daysLeft >= 0 && t.daysLeft <= 7 && t.status !== "Completed")
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <CalendarIcon className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Upcoming (7 Days)</h3>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">No upcoming deadlines</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-lg"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-amber-100 p-2">
          <CalendarIcon className="h-5 w-5 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Upcoming (7 Days)</h3>
      </div>
      
      <div className="space-y-2">
        {upcoming.map((task) => (
          <motion.div 
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-gradient-to-r from-white to-slate-50 p-3"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`h-2 w-2 rounded-full ${
                task.daysLeft === 0 ? "bg-red-500" : task.daysLeft <= 2 ? "bg-amber-500" : "bg-blue-500"
              }`} />
              <span className="text-sm font-medium text-slate-700 truncate">
                {task.name}
              </span>
            </div>
            <span className={`ml-2 shrink-0 text-xs font-semibold ${
              task.daysLeft === 0 
                ? "text-red-600" 
                : task.daysLeft <= 2 
                ? "text-amber-600" 
                : "text-blue-600"
            }`}>
              {task.daysLeft === 0 ? "Today" : `${task.daysLeft}d`}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};



const OverdueTasks = ({ tasks }: { tasks: TimelineItem[] }) => {
  const overdue = tasks
    .map((t) => ({
      ...t,
      daysOverdue: Math.ceil(
        (new Date().getTime() - new Date(t.end).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))
    .filter((t) => t.daysOverdue > 0 && t.status !== "Completed")
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border border-red-200/60 bg-red-50/85 p-6 backdrop-blur-[20px] shadow-lg"
    >
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-red-900">Overdue Tasks</h3>
      <div className="mt-4 space-y-3">
        {overdue.length === 0 ? (
          <p className="text-sm text-red-700">No overdue tasks</p>
        ) : (
          overdue.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-lg bg-red-100/50 p-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="text-sm font-medium text-red-900 truncate">{task.name}</span>
              </div>
              <span className="ml-2 shrink-0 text-xs font-semibold text-red-600">
                {task.daysOverdue}d ago
              </span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

const GanttChart = ({
  tasks,
  mode,
  onTaskClick,
}: {
  tasks: TimelineItem[];
  mode: ViewMode;
  onTaskClick: (t: TimelineItem) => void;
}) => {
  const validTasks = (tasks as TimelineItemWithFallbackDates[]).filter((task) => {
    const start = task.start || task.startDate;
    const end = task.end || task.dueDate;
    return Boolean(start && end && !isNaN(new Date(start).getTime()) && !isNaN(new Date(end).getTime()));
  });

  const normalizedTasks: NormalizedTimelineItem[] = validTasks.map((task) => ({
    ...task,
    start: (task.start || task.startDate) as string,
    end: (task.end || task.dueDate) as string,
  }));

  if (normalizedTasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[24px] border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-20 text-center shadow-sm"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <Calendar className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-700">No Timeline Tasks</h3>
        <p className="mb-6 text-slate-500">No tasks found for this project. Create your first task to start planning.</p>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105">
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </motion.div>
    );
  }

  const allStarts = normalizedTasks.map((t) => new Date(t.start).getTime());
  const allEnds   = normalizedTasks.map((t) => new Date(t.end).getTime());
  const rangeStart = startOfDay(new Date(Math.min(...allStarts) - DAY_MS));
  const rangeEnd   = startOfDay(new Date(Math.max(...allEnds)   + DAY_MS * 2));

  const totalDays  = diffDays(rangeStart, rangeEnd);
  const step       = columnDays(mode);
  const colCount   = Math.ceil(totalDays / step);
  const totalWidth = colCount * COL_WIDTH_PX;

  const cols: Date[] = Array.from({ length: colCount }, (_, i) =>
    addDays(rangeStart, i * step)
  );

  const today = startOfDay(new Date());
  const todayLeft =
    Math.round((diffDays(rangeStart, today) / step) * COL_WIDTH_PX);

  const LABEL_W = 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-lg" 
      style={{ minHeight: "400px" }}
    >
      <div className="flex min-h-full">
        {/* Fixed task names column */}
        <div className="shrink-0 border-r border-slate-200 bg-slate-50" style={{ width: LABEL_W }}>
          <div className="flex h-14 items-center border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50 px-4">
            <span className="text-sm font-semibold text-slate-700">Tasks</span>
          </div>
          {normalizedTasks.map((task) => (
            <div
              key={task.id}
              className="group flex h-12 cursor-pointer items-center border-b border-slate-100 px-4 transition-all hover:bg-blue-50"
              onClick={() => onTaskClick(task)}
            >
              <div className={`mr-3 h-3 w-3 rounded-full ${STATUS_BAR[task.status] ?? "bg-slate-400"} shadow-sm`} />
              <span className="truncate text-sm font-medium text-slate-700 group-hover:text-blue-700">
                {task.name}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable timeline area */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ width: Math.max(totalWidth, 800), minWidth: "100%" }}>
            {/* Header row */}
            <div className="flex h-14 border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50">
              {cols.map((col, i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center justify-center border-r border-slate-200/50 px-2"
                  style={{ width: COL_WIDTH_PX }}
                >
                  <span className="truncate text-xs font-medium text-slate-600">
                    {formatAxisDate(col, mode)}
                  </span>
                </div>
              ))}
            </div>

            {/* Task rows */}
            {normalizedTasks.map((task) => {
              const taskStart  = startOfDay(new Date(task.start));
              const taskEnd    = startOfDay(new Date(task.end));
              const startCol   = diffDays(rangeStart, taskStart) / step;
              const endCol     = diffDays(rangeStart, taskEnd)   / step;
              const barLeft    = Math.round(startCol * COL_WIDTH_PX);
              const barWidth   = Math.max(COL_WIDTH_PX * 0.6, Math.round((endCol - startCol) * COL_WIDTH_PX));

              return (
                <div
                  key={task.id}
                  className="relative flex h-12 items-center border-b border-slate-100 hover:bg-slate-50/50"
                  style={{ width: Math.max(totalWidth, 800) }}
                >
                  {/* Grid lines */}
                  {cols.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full border-r border-slate-100"
                      style={{ left: i * COL_WIDTH_PX }}
                    />
                  ))}

                  {/* Today indicator */}
                  {todayLeft >= 0 && todayLeft <= totalWidth && (
                    <div
                      className="absolute top-0 z-10 h-full w-0.5 bg-red-400 shadow-sm"
                      style={{ left: todayLeft }}
                    >
                      <div className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-red-400 shadow-sm" />
                    </div>
                  )}

                  {/* Task bar */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    onClick={() => onTaskClick(task)}
                    className={`absolute z-20 flex h-7 items-center rounded-lg px-3 text-left shadow-sm transition-all hover:shadow-md ${STATUS_BAR[task.status] ?? "bg-slate-400"}`}
                    style={{ left: barLeft, width: barWidth }}
                  >
                    {/* Progress overlay */}
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 rounded-lg bg-black/20"
                      style={{ width: `${task.progress}%` }}
                    />
                    <span className="relative truncate text-xs font-semibold text-white drop-shadow-sm">
                      {task.name}
                    </span>
                    <div className="ml-auto text-[10px] font-medium text-white/80">
                      {task.progress}%
                    </div>
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="flex flex-wrap items-center gap-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
        {Object.entries(STATUS_BAR).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded ${cls} shadow-sm`} />
            <span className="text-sm font-medium text-slate-600">{status}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="h-3 w-0.5 bg-red-400 shadow-sm" />
          <span className="text-sm font-medium text-slate-600">Today</span>
        </div>
      </div>
    </motion.div>
  );
};

export const ProjectTimelinePage = () => {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<TimelineProject | null>(null);
  const [tasks, setTasks] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ViewMode>("week");
  const [selected, setSelected] = useState<TimelineItem | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    projectService
      .getTimeline(id)
      .then(({ project, tasks }) => {
        setProject(project);
        setTasks(tasks);
      })
      .catch(() => setError("Failed to load timeline. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center pt-24">
      <Spinner className="h-8 w-8 text-blue-400" />
    </div>
  );

  if (error) return (
    <div className="rounded-[24px] border border-red-200/60 bg-red-50/85 px-6 py-4 text-sm text-red-700 backdrop-blur-[20px]">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {error}
      </div>
    </div>
  );

  if (!project) {
    return (
      <div className="rounded-[24px] border border-red-200/60 bg-red-50/85 px-6 py-4 text-sm text-red-700 backdrop-blur-[20px]">
        Project not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project header */}
      <ProjectHeader project={project} onBack={`/projects/${id}`} totalTasks={tasks.length} />

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Timeline
            <span className="ml-2 text-sm font-normal text-slate-500">{tasks.length} tasks</span>
          </h2>
        </div>

        {/* View mode switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-flex rounded-2xl border border-slate-200/60 bg-white/85 p-1 backdrop-blur-[20px] w-fit"
        >
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                mode === v
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Summary cards */}
      <SummaryCards tasks={tasks} />

      {/* Main content grid */}
      <div className="grid gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-8">
          {/* Gantt chart */}
          <GanttChart tasks={tasks} mode={mode} onTaskClick={setSelected} />
        </div>
        
        <div className="space-y-8">
          {/* Project Insights Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-bold text-slate-900">Project Insights</h2>
            <TaskStats tasks={tasks} />
            {/* Upcoming deadlines */}
            <UpcomingDeadlines tasks={tasks} />
          </motion.div>
        </div>
      </div>

      {/* Task detail side panel */}
      {selected && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelected(null)}
          />
          <TaskPanel task={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
};
