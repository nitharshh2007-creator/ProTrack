import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/formatDate";
import { taskService, commentService, userService } from "@/services";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useAuth } from "@/store/auth.store";
import {
  Search, Plus, Eye, Edit, Trash,
  Clipboard, ArrowUpRight
} from "lucide-react";

const STATUS_OPTIONS: TaskStatus[] = ["Todo", "In Progress", "Review", "Blocked", "Completed"];
const PRIORITY_OPTIONS: TaskPriority[] = ["Low", "Medium", "High"];

const statusAccent: Record<string, string> = {
  Todo: '#60A5FA',
  'In Progress': '#3B82F6',
  Review: '#F59E0B',
  Blocked: '#ef4444',
  Completed: '#22c55e',
};

export const TasksPage = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin", "manager");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "title">("dueDate");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);


  const fetchTasks = () => {
    setLoading(true);
    setError("");
    taskService
      .getAll()
      .then(async (fetchedTasks) => {
        setTasks(fetchedTasks);
        const counts: Record<string, number> = {};
        for (const task of fetchedTasks) {
          try {
            const comments = await commentService.getByTask(task._id);
            counts[task._id] = comments.length;
          } catch {
            counts[task._id] = 0;
          }
        }
        setCommentCounts(counts);
      })
      .catch(() => setError("Failed to load tasks. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
    userService.getAll().then((u) => setAllUsers(u)).catch(() => {});
  }, []);



  const assignees = useMemo(() => allUsers.map((u) => ({ _id: u._id, name: u.name })), [allUsers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let filtered = tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter && t.assignedTo?._id !== assigneeFilter) return false;
      return true;
    });

    if (sortBy === "dueDate") {
      filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else if (sortBy === "priority") {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    } else if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, sortBy]);

  const handleSaved = (saved: Task) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t._id === saved._id);
      return exists
        ? prev.map((t) => (t._id === saved._id ? saved : t))
        : [saved, ...prev];
    });
    setModalOpen(false);
    setEditingTask(undefined);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteConfirmId(null);
    try {
      await taskService.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch {
      alert("Failed to delete task. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");
  };

  const getProgressPercentage = (status: TaskStatus) => {
    const progressMap: Record<TaskStatus, number> = {
      Todo: 0, "In Progress": 40, Review: 70, Blocked: 30, Completed: 100
    };
    return progressMap[status] || 0;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-950 p-8 md:p-10 shadow-[0_24px_50px_rgba(0,0,0,0.6)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(147,51,234,0.08),_transparent_45%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
              Workspace Core
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">Tasks</h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Organize, track and collaborate on all project work with team members.
            </p>
          </div>
          
          {canManage && (
            <button
              onClick={() => setModalOpen(true)}
              className="premium-button-primary shrink-0 self-start md:self-center"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter / Search Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="premium-card p-4 bg-[#131B2E]/80 backdrop-blur-md border border-white/5 rounded-2xl"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks, projects, assignees, comments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="premium-input pl-10 pr-4 py-2 bg-[#0B0F19] border border-white/5 focus:border-blue-500 rounded-xl transition-all text-sm"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}
                className="premium-input px-3 py-2 w-auto bg-[#0B0F19] border border-white/5 rounded-xl text-xs font-semibold cursor-pointer text-slate-350"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
                className="premium-input px-3 py-2 w-auto bg-[#0B0F19] border border-white/5 rounded-xl text-xs font-semibold cursor-pointer text-slate-350"
              >
                <option value="">All Priorities</option>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>

              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="premium-input px-3 py-2 w-auto bg-[#0B0F19] border border-white/5 rounded-xl text-xs font-semibold cursor-pointer text-slate-350"
              >
                <option value="">All Assignees</option>
                {assignees.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="premium-input px-3 py-2 w-auto bg-[#0B0F19] border border-white/5 rounded-xl text-xs font-semibold cursor-pointer text-slate-350"
              >
                <option value="dueDate">Sort: Due Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="title">Sort: Title</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {(search || statusFilter || priorityFilter || assigneeFilter) && (
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-2 text-xs font-bold text-red-400"
                >
                  Clear Filters
                </button>
              )}
              <div className="rounded-xl border border-white/5 bg-[#0B0F19] px-3.5 py-2 text-xs font-bold text-slate-400 shrink-0">
                {filtered.length} tasks
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8 text-blue-400" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="premium-card p-6 border-red-950/20 bg-red-950/10 text-center"
        >
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchTasks} className="premium-button-danger text-xs px-4 py-2">
            Retry Loading
          </button>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-empty-state py-16"
        >
          <Clipboard className="h-10 w-10 text-slate-600 mb-3" />
          <div className="text-center">
            <h3 className="text-sm font-semibold text-white mb-1">
              {tasks.length === 0 ? "No Tasks Yet" : "No Matching Tasks"}
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
              {tasks.length === 0 ? "Get started by adding your first task to the board." : "Try widening your filters or search keywords."}
            </p>
            {canManage && tasks.length === 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="premium-button-primary"
              >
                <Plus className="h-4 w-4" />
                Create Task
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Tasks Grid */}
      {!loading && !error && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((task, index) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -4 }}
              className="premium-card flex flex-col justify-between relative bg-[#131B2E] border border-white/5 p-5 shadow-2xl rounded-2xl min-h-[360px]"
            >
              {/* Task Status Accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: statusAccent[task.status] || '#60A5FA' }}
              />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {task.project?.title || "Workspace"}
                    </span>
                    <h3 className="font-extrabold text-white text-base leading-snug mt-0.5 group-hover:text-blue-400">
                      {task.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/tasks/${task._id}`}
                      className="rounded-lg p-1 text-slate-400 hover:text-blue-400 hover:bg-white/5 transition"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleEdit(task)}
                          className="rounded-lg p-1 text-slate-400 hover:text-amber-400 hover:bg-white/5 transition"
                          title="Edit Task"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          disabled={deletingId === task._id}
                          className="rounded-lg p-1 text-slate-400 hover:text-red-400 hover:bg-white/5 disabled:opacity-50 transition"
                          title="Delete Task"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-400 line-clamp-2">{task.description}</p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-bold text-white">{getProgressPercentage(task.status)}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#0B0F19] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage(task.status)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    />
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 bg-[#0B0F19] rounded-xl p-3 border border-white/5">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Assignee</span>
                    <span className="text-xs text-slate-300 font-semibold mt-0.5 block truncate">
                      {task.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Due Date</span>
                    <span className="text-xs text-slate-350 font-semibold mt-0.5 block truncate">
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 text-[9px] font-bold">
                  <span
                    className="inline-flex items-center rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-blue-400"
                  >
                    {task.status}
                  </span>
                  <span
                    className="inline-flex items-center rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-amber-400"
                  >
                    {task.priority} Priority
                  </span>
                </div>

                {/* Attachments & Comments counters */}
                <div className="flex gap-2">
                  <div className="rounded-full bg-white/5 border border-white/5 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
                    💬 {commentCounts[task._id] || 0}
                  </div>
                  <div className="rounded-full bg-white/5 border border-white/5 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
                    📎 {(task as any).attachments?.length || 0}
                  </div>
                </div>
              </div>

              {/* Open Workspace Action */}
              <div className="pt-4 border-t border-white/5 mt-4">
                <Link
                  to={`/tasks/${task._id}`}
                  className="flex items-center justify-center w-full rounded-xl bg-blue-600/90 hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow transition-all duration-300"
                >
                  Open Workspace
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-4 w-full max-w-sm rounded-2xl bg-[#131B2E] border border-white/10 p-6 shadow-2xl"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <Trash className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Delete Task</h3>
              <p className="mb-6 text-sm text-slate-400">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 premium-button-secondary py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete(deleteConfirmId)}
                  disabled={deletingId === deleteConfirmId}
                  className="flex-1 premium-button-danger py-2 text-sm"
                >
                  {deletingId === deleteConfirmId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(undefined);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

