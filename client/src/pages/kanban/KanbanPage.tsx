import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { motion } from "framer-motion";
import { taskService, commentService } from "@/services";
import type { Task, TaskStatus } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { useAuth } from "@/store/auth.store";
import { Toast } from "@/components/ui/Toast";
import { Search } from "lucide-react";

const COLUMNS: TaskStatus[] = ["Todo", "In Progress", "Review", "Blocked", "Completed"];

const COLUMN_STYLES: Record<TaskStatus, { bg: string; dot: string; color: string }> = {
  Todo:         { bg: "bg-gray-50",   dot: "bg-gray-400", color: "#64748b"   },
  "In Progress":{ bg: "bg-blue-50",    dot: "bg-blue-500", color: "#2563eb"   },
  Review:       { bg: "bg-yellow-50",  dot: "bg-yellow-500", color: "#f59e0b" },
  Blocked:      { bg: "bg-red-50",     dot: "bg-red-500", color: "#ef4444"    },
  Completed:    { bg: "bg-green-50",   dot: "bg-green-500", color: "#10b981"  },
};

type Board = Record<TaskStatus, Task[]>;

const buildBoard = (tasks: Task[]): Board => {
  const board = Object.fromEntries(COLUMNS.map((c) => [c, [] as Task[]])) as unknown as Board;
  for (const task of tasks) {
    if (task.status in board) board[task.status].push(task);
  }
  return board;
};

export const KanbanPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin", "manager");

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragError, setDragError] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Configure sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Auto-scroll functionality
  const handleAutoScroll = useCallback((event: DragOverEvent) => {
    const { delta } = event;
    const container = scrollContainerRef.current;
    
    if (!container || !delta) return;
    
    const containerRect = container.getBoundingClientRect();
    const scrollZone = 100; // pixels from edge to trigger scroll
    
    // Check if we're near the left or right edge
    if (delta.x < containerRect.left + scrollZone) {
      // Scroll left
      container.scrollBy({ left: -10, behavior: 'smooth' });
    } else if (delta.x > containerRect.right - scrollZone) {
      // Scroll right
      container.scrollBy({ left: 10, behavior: 'smooth' });
    }
  }, []);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    setError("");
    taskService
      .getAll()
      .then(async (tasks) => {
        setBoard(buildBoard(tasks));
        // Fetch comment counts
        const counts: Record<string, number> = {};
        for (const task of tasks) {
          try {
            const comments = await commentService.getByTask(task._id);
            counts[task._id] = comments.length;
          } catch {
            counts[task._id] = 0;
          }
        }
        setCommentCounts(counts);
      })
      .catch(() => setError("Failed to load tasks."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Statistics and insights
  const stats = useMemo(() => {
    if (!board) return { total: 0, inProgress: 0, completed: 0, blocked: 0, review: 0, dueToday: 0, overdue: 0 };
    
    const allTasks = Object.values(board).flat();
    const today = new Date().toDateString();
    
    return {
      total: allTasks.length,
      inProgress: board["In Progress"].length,
      completed: board.Completed.length,
      blocked: board.Blocked.length,
      review: board.Review.length,
      dueToday: allTasks.filter(t => new Date(t.dueDate).toDateString() === today).length,
      overdue: allTasks.filter(t => new Date(t.dueDate) < new Date()).length
    };
  }, [board]);

  // Filtered board
  const filteredBoard = useMemo(() => {
    if (!board) return null;
    
    const filtered: Board = Object.fromEntries(
      COLUMNS.map(col => [
        col,
        board[col].filter(task => {
          const matchesSearch = !search || 
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.description.toLowerCase().includes(search.toLowerCase());
          
          const matchesProject = !projectFilter || task.project?.title === projectFilter;
          const matchesAssignee = !assigneeFilter || task.assignedTo?.name === assigneeFilter;
          const matchesPriority = !priorityFilter || task.priority === priorityFilter;
          
          return matchesSearch && matchesProject && matchesAssignee && matchesPriority;
        })
      ])
    ) as Board;
    
    return filtered;
  }, [board, search, projectFilter, assigneeFilter, priorityFilter]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    if (!board) return { projects: [], assignees: [], priorities: [] };
    
    const allTasks = Object.values(board).flat();
    
    return {
      projects: Array.from(new Set(allTasks.map(t => t.project?.title).filter(Boolean))),
      assignees: Array.from(new Set(allTasks.map(t => t.assignedTo?.name).filter(Boolean))),
      priorities: Array.from(new Set(allTasks.map(t => t.priority)))
    };
  }, [board]);

  const onDragStart = (event: DragStartEvent) => {
    if (!canEdit) return;
    const { active } = event;
    const taskId = active.id as string;
    
    // Find the task being dragged
    const task = Object.values(board || {}).flat().find(t => t._id === taskId);
    setActiveTask(task || null);
  };

  const onDragOver = (event: DragOverEvent) => {
    if (!canEdit || !board) return;
    handleAutoScroll(event);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if (!canEdit) return;
    
    const { active, over } = event;
    setActiveTask(null);
    setDragError("");

    if (!over || !board) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    // Find the task and its current status
    let currentTask: Task | null = null;
    let currentStatus: TaskStatus | null = null;
    
    for (const [status, tasks] of Object.entries(board) as [TaskStatus, Task[]][]) {
      const task = tasks.find(t => t._id === taskId);
      if (task) {
        currentTask = task;
        currentStatus = status;
        break;
      }
    }

    if (!currentTask || !currentStatus || currentStatus === newStatus) return;

    // Optimistic update
    const prevBoard = structuredClone(board);
    const updatedTask = { ...currentTask, status: newStatus };
    
    const newBoard = { ...board };
    newBoard[currentStatus] = newBoard[currentStatus].filter(t => t._id !== taskId);
    newBoard[newStatus] = [...newBoard[newStatus], updatedTask];
    
    setBoard(newBoard);

    try {
      await taskService.update(taskId, { status: newStatus });
      
      // Show success toast
      setShowToast({
        message: `Task moved to ${newStatus}`,
        type: 'success'
      });
    } catch {
      setBoard(prevBoard);
      setDragError(`Failed to move "${currentTask.title}". Change reverted.`);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setProjectFilter("");
    setAssigneeFilter("");
    setPriorityFilter("");
  };

  if (loading) return (
    <div className="flex justify-center pt-24">
      <Spinner className="h-8 w-8" />
    </div>
  );

  if (error) return (
    <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
      {error}{" "}
      <button onClick={fetchTasks} className="underline font-medium">Retry</button>
    </div>
  );

  if (!board || !filteredBoard) return null;

  return (
    <div className="space-y-8">
      {/* HERO SECTION - Profile Page Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#101728] px-8 py-12 shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Workspace Board</p>
          <h1 className="text-3xl font-bold text-white">Kanban</h1>
          <p className="text-sm text-slate-400">Visual task management and team collaboration</p>
        </div>
      </motion.div>

      {/* PREMIUM SEARCH & FILTER TOOLBAR */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md"
      >
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Premium Search Bar */}
              <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-700 dark:text-slate-200 shadow-sm transition focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Projects</option>
                {filterOptions.projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
              
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-700 dark:text-slate-200 shadow-sm transition focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Assignees</option>
                {filterOptions.assignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-700 dark:text-slate-200 shadow-sm transition focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Priorities</option>
                {filterOptions.priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
              
              {(search || projectFilter || assigneeFilter || priorityFilter) && (
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-100"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Readonly notice */}
      {!canEdit && (
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-600">
          View only — you do not have permission to move tasks.
        </div>
      )}

      {/* Drag error banner */}
      {dragError && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          <span>{dragError}</span>
          <button onClick={() => setDragError("")} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* KANBAN BOARD */}
      <div className="relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <div ref={scrollContainerRef} className="overflow-x-auto pb-4">
            <div className="flex gap-6" style={{ minWidth: 'max-content' }}>
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col}
                  status={col}
                  tasks={filteredBoard[col]}
                  color={COLUMN_STYLES[col].bg}
                  headerColor={COLUMN_STYLES[col].dot}
                  statusColor={COLUMN_STYLES[col].color}
                  readonly={!canEdit}
                  commentCounts={commentCounts}
                />
              ))}
            </div>
          </div>
          
          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <div className="rotate-2 scale-105">
                <KanbanCard
                  task={activeTask}
                  index={0}
                  readonly={false}
                  commentCounts={commentCounts}
                  isDragOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}


    </div>
  );
};
