import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/formatDate";
import { taskService, commentService, userService } from "@/services";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useAuth } from "@/store/auth.store";
import {
  Search, Filter, CheckCircle, Clock, AlertCircle, BarChart3,
  Plus, User, Calendar, MessageSquare, Paperclip, Eye, Edit, Trash,
  Clipboard, ArrowUpRight
} from "lucide-react";

const STATUS_OPTIONS: TaskStatus[] = ["Todo", "In Progress", "Review", "Blocked", "Completed"];
const PRIORITY_OPTIONS: TaskPriority[] = ["Low", "Medium", "High"];

const statusConfig = {
  Todo: { bg: "#DBEAFE", text: "#2563EB", dot: "#94a3b8" },
  "In Progress": { bg: "#CFFAFE", text: "#0891B2", dot: "#3b82f6" },
  Review: { bg: "#E9D5FF", text: "#9333EA", dot: "#f59e0b" },
  Blocked: { bg: "#FEE2E2", text: "#DC2626", dot: "#ef4444" },
  Completed: { bg: "#DCFCE7", text: "#16A34A", dot: "#22c55e" },
};

const statusAccent: Record<string, string> = {
  Todo: '#60A5FA',
  'In Progress': '#3B82F6',
  Review: '#F59E0B',
  Blocked: '#ef4444',
  Completed: '#22c55e',
};

const priorityConfig = {
  Low: { bg: "#F3F4F6", text: "#6B7280" },
  Medium: { bg: "#FEF3C7", text: "#D97706" },
  High: { bg: "#FEE2E2", text: "#DC2626" },
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

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "Completed").length;
    const inProgress = tasks.filter(t => t.status === "In Progress").length;
    const blocked = tasks.filter(t => t.status === "Blocked").length;
    return { total, completed, inProgress, blocked };
  }, [tasks]);

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
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#101728] px-8 py-12 shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Task Management</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
          <p className="text-sm text-slate-400">Organize, track and collaborate on all project work</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[20px] border border-gray-200 dark:border-slate-800 backdrop-blur-[20px] shadow-xl bg-white dark:bg-slate-900/80"
      >
        <div className="p-6 pb-4">
          <div className="relative max-w-4xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, assignees, comments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[20px] border-0 bg-white dark:bg-slate-800/50 pl-12 pr-4 py-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm outline-none backdrop-blur-sm transition-all focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] focus:ring-1 focus:ring-blue-400"
              style={{ minWidth: '600px', maxWidth: '700px' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 pb-6">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}
              className="rounded-xl border-0 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-sm transition focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-400/20"
            >
              <option value="">Status</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
              className="rounded-xl border-0 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-sm transition focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-400/20"
            >
              <option value="">Priority</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-xl border-0 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-sm transition focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-400/20"
            >
              <option value="">Assignee</option>
              {assignees.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl border-0 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-sm transition focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-400/20"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {canManage && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New Task
              </button>
            )}

            {(search || statusFilter || priorityFilter || assigneeFilter) && (
              <button
                onClick={clearFilters}
                className="rounded-xl bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 shadow-sm transition hover:bg-red-500/30"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="flex justify-center pt-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {!loading && error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-red-500/20 border border-red-800 p-6 text-center"
        >
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchTasks} className="text-red-400 font-semibold hover:underline">
            Retry
          </button>
        </motion.div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 py-16"
        >
          <Clipboard className="h-12 w-12 text-slate-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-100 mb-1">
              {tasks.length === 0 ? "No Tasks Yet" : "No Tasks Match Filters"}
            </h3>
            <p className="text-slate-400 mb-4">
              {tasks.length === 0 ? "Create your first task to get started" : "Try adjusting your search criteria"}
            </p>
            {canManage && tasks.length === 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Create Task
              </button>
            )}
          </div>
        </motion.div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((task, index) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, boxShadow: '0 25px 50px rgba(37,99,235,0.15)' }}
              className="relative group bg-white dark:bg-slate-900/80 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 shadow-lg transition-all duration-300"
              style={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)' }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl transition-all duration-300 group-hover:shadow-sm"
                style={{ backgroundColor: statusAccent[task.status] }}
              />

              <div className="mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">{task.project?.title || "Backend"}</div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight text-lg">{task.title}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/tasks/${task._id}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 transition"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleEdit(task)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/20 transition"
                          title="Edit Task"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          disabled={deletingId === task._id}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition"
                          title="Delete Task"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                <div className="text-sm font-semibold text-slate-300">{task.project?.title || "ATRIVA"}</div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <User className="h-4 w-4" />
                  {task.assignedTo?.name || "Tara"}
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <Calendar className="h-4 w-4" />
                  {formatDate(task.dueDate)}
                </div>
              </div>

              <div className="mb-4 flex gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: statusConfig[task.status].bg,
                    color: statusConfig[task.status].text
                  }}
                >
                  🔴 {task.status}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: priorityConfig[task.priority].bg,
                    color: priorityConfig[task.priority].text
                  }}
                >
                  🔴 {task.priority}
                </span>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">Progress</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{getProgressPercentage(task.status)}%</span>
                </div>
                <div className="h-[10px] rounded-full bg-slate-700 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage(task.status)}%` }}
                    transition={{ duration: 0.9, delay: index * 0.06 }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }}
                  />
                </div>
              </div>

              <div className="mb-4 flex gap-2">
                <div className="rounded-full bg-slate-800/50 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
                  💬{commentCounts[task._id] || 2}
                </div>
                <div className="rounded-full bg-slate-800/50 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
                  📎{task.attachments?.length || 3}
                </div>
                <div className="rounded-full bg-slate-800/50 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
                  👥1
                </div>
              </div>

              {(task.attachments?.length || 3) > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-slate-400 mb-2">📎 Attachments</div>
                  <div className="flex gap-2">
                    <div className="rounded-lg bg-slate-800/50 px-2 py-1 text-xs text-slate-400">[design.pdf]</div>
                    <div className="rounded-lg bg-slate-800/50 px-2 py-1 text-xs text-slate-400">[screenshot.png]</div>
                    <div className="rounded-lg bg-slate-800/50 px-2 py-1 text-xs text-slate-400">[meeting.mp4]</div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="text-xs font-medium text-slate-400 mb-2">Recent Activity</div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>• Tara uploaded design.pdf</div>
                  <div>• Backend moved to {task.status}</div>
                </div>
              </div>

              <div className="mb-4 text-xs text-slate-500">
                Last updated 2h ago
              </div>

              <Link
                to={`/tasks/${task._id}`}
                className="block w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 shadow transition-all duration-300 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}
              >
                <div className="flex items-center justify-center gap-2">
                  Open Workspace
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-slate-800"
          >
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                  <Trash className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">Delete Task</h3>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete(deleteConfirmId)}
                  disabled={deletingId === deleteConfirmId}
                  className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {deletingId === deleteConfirmId ? 'Deleting...' : 'Delete Task'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
