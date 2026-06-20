import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { projectService } from "@/services";
import type { TimelineItem, TimelineProject } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/formatDate";

// ── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";
type TimelineItemWithFallbackDates = TimelineItem & {
  startDate?: string;
  dueDate?: string;
};
type NormalizedTimelineItem = TimelineItemWithFallbackDates & {
  start: string;
  end: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_BAR: Record<string, string> = {
  Todo:          "bg-gray-400",
  "In Progress": "bg-blue-500",
  Review:        "bg-yellow-400",
  Blocked:       "bg-red-500",
  Completed:     "bg-green-500",
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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const COL_WIDTH_PX = 56; // px per column

// ── Sub-components ───────────────────────────────────────────────────────────

const ProjectHeader = ({
  project,
  onBack,
}: {
  project: TimelineProject;
  onBack: string;
}) => (
  <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div>
        <Link to={onBack} className="mb-1 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
          ← Back to project
        </Link>
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">{project.title}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-gray-500">{project.description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STATUS_BADGE[project.status] ?? "default"}>{project.status}</Badge>
        <Badge variant={PRIORITY_BADGE[project.priority] ?? "default"}>{project.priority}</Badge>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all"
          style={{ width: `${project.progress}%` }}
        />
      </div>
      <span className="shrink-0 text-sm font-semibold text-blue-600">{project.progress}%</span>
    </div>
  </div>
);

const TaskPanel = ({
  task,
  onClose,
}: {
  task: TimelineItem;
  onClose: () => void;
}) => (
  <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl sm:w-96">
    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
      <h2 className="text-sm font-semibold text-gray-800">Task Details</h2>
      <button
        onClick={onClose}
        className="rounded p-1 text-gray-400 hover:bg-gray-100"
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Task</p>
        <p className="mt-0.5 text-base font-semibold text-gray-800">{task.name}</p>
      </div>
      {task.description && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
          <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">{task.description}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
          <div className="mt-1">
            <Badge variant={STATUS_BADGE[task.status] ?? "default"}>{task.status}</Badge>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Priority</p>
          <div className="mt-1">
            <Badge variant={PRIORITY_BADGE[task.priority] ?? "default"}>{task.priority}</Badge>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Assignee</p>
          <p className="mt-0.5 text-sm text-gray-700">{task.assignedTo?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Progress</p>
          <p className="mt-0.5 text-sm font-semibold text-blue-600">{task.progress}%</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Start Date</p>
          <p className="mt-0.5 text-sm text-gray-700">{formatDate(task.start)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Due Date</p>
          <p className="mt-0.5 text-sm text-gray-700">{formatDate(task.end)}</p>
        </div>
      </div>
      {task.start && task.end && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Duration</p>
          <p className="mt-0.5 text-sm text-gray-700">
            {Math.max(1, diffDays(new Date(task.start), new Date(task.end)))} day(s)
          </p>
        </div>
      )}
    </div>
  </div>
);

// ── Gantt chart ───────────────────────────────────────────────────────────────

const GanttChart = ({
  tasks,
  mode,
  onTaskClick,
}: {
  tasks: TimelineItem[];
  mode: ViewMode;
  onTaskClick: (t: TimelineItem) => void;
}) => {
  // Debug: Log incoming data
  console.log("Gantt Tasks:", tasks);

  const validTasks = (tasks as TimelineItemWithFallbackDates[]).filter((task) => {
    const start = task.start || task.startDate;
    const end = task.end || task.dueDate;
    return Boolean(start && end && !isNaN(new Date(start).getTime()) && !isNaN(new Date(end).getTime()));
  });
  
  console.log("Gantt Valid Tasks:", validTasks);

  const normalizedTasks: NormalizedTimelineItem[] = validTasks.map((task) => ({
    ...task,
    start: (task.start || task.startDate) as string,
    end: (task.end || task.dueDate) as string,
  }));

  if (normalizedTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
        No tasks with valid start and due dates.
      </div>
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

  const LABEL_W = 160;

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden min-h-96">
      {/* Scrollable chart */}
      <div className="flex min-h-full">
        {/* Fixed task names column */}
        <div className="shrink-0 border-r border-gray-100" style={{ width: LABEL_W }}>
          {/* Header spacer */}
          <div className="h-10 border-b border-gray-100 bg-gray-50" />
          {normalizedTasks.map((task) => (
            <div
              key={task.id}
              className="flex h-12 cursor-pointer items-center border-b border-gray-50 px-3 hover:bg-gray-50"
              onClick={() => onTaskClick(task)}
            >
              <span className={`mr-2 h-2 w-2 shrink-0 rounded-full ${STATUS_BAR[task.status] ?? "bg-gray-400"}`} />
              <span className="truncate text-xs font-medium text-gray-700">{task.name}</span>
            </div>
          ))}
        </div>

        {/* Scrollable timeline area */}
        <div className="overflow-x-auto flex-1">
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Axis row */}
            <div className="flex h-10 border-b border-gray-100 bg-gray-50">
              {cols.map((col, i) => (
                <div
                  key={i}
                  className="shrink-0 border-r border-gray-100 px-1 flex items-center"
                  style={{ width: COL_WIDTH_PX }}
                >
                  <span className="truncate text-[10px] text-gray-400">
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
              const barWidth   = Math.max(COL_WIDTH_PX * 0.5, Math.round((endCol - startCol) * COL_WIDTH_PX));

              return (
                <div
                  key={task.id}
                  className="relative flex h-12 items-center border-b border-gray-50"
                  style={{ width: totalWidth }}
                >
                  {/* Grid lines */}
                  {cols.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full border-r border-gray-50"
                      style={{ left: i * COL_WIDTH_PX }}
                    />
                  ))}

                  {/* Today marker */}
                  {todayLeft >= 0 && todayLeft <= totalWidth && (
                    <div
                      className="absolute top-0 h-full w-px bg-red-300"
                      style={{ left: todayLeft }}
                    />
                  )}

                  {/* Task bar */}
                  <button
                    onClick={() => onTaskClick(task)}
                    className={`absolute flex h-7 cursor-pointer items-center rounded-md px-2 text-left transition-opacity hover:opacity-90 ${STATUS_BAR[task.status] ?? "bg-gray-400"}`}
                    style={{ left: barLeft, width: barWidth }}
                  >
                    {/* Progress fill */}
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 rounded-md bg-black/10"
                      style={{ width: `${task.progress}%` }}
                    />
                    <span className="relative truncate text-[10px] font-semibold text-white">
                      {task.name}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 border-t border-gray-100 px-4 py-3">
        {Object.entries(STATUS_BAR).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
            <span className="text-xs text-gray-500">{status}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-px bg-red-300" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

export const ProjectTimelinePage = () => {
  const { id } = useParams<{ id: string }>();

  const [project, setProject]     = useState<TimelineProject | null>(null);
  const [tasks, setTasks]         = useState<TimelineItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [mode, setMode]           = useState<ViewMode>("week");
  const [selected, setSelected]   = useState<TimelineItem | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    console.log("Timeline API Data:", { projectId: id });
    projectService
      .getTimeline(id)
      .then(({ project, tasks }) => {
        console.log("Timeline API Data:", { project, tasks });
        setProject(project);
        setTasks(tasks);
      })
      .catch(() => setError("Failed to load timeline. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center pt-24">
      <Spinner className="h-8 w-8" />
    </div>
  );

  if (error) return (
    <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
      {error}
    </div>
  );

  if (!project) {
    return (
      <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
        Project not found
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Project header */}
      <ProjectHeader project={project} onBack={`/projects/${id}`} />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700">
          Timeline
          <span className="ml-2 text-sm font-normal text-gray-400">{tasks.length} tasks</span>
        </h2>

        {/* View mode switcher */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === v
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt chart */}
      <GanttChart tasks={tasks} mode={mode} onTaskClick={setSelected} />

      {/* Task detail side panel */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelected(null)}
          />
          <TaskPanel task={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
};
