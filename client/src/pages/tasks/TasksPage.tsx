import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/formatDate";
import { taskService } from "@/services";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useAuth } from "@/store/auth.store";

const STATUS_OPTIONS: TaskStatus[] = ["Todo", "In Progress", "Review", "Blocked", "Completed"];
const PRIORITY_OPTIONS: TaskPriority[] = ["Low", "Medium", "High"];

const statusVariant: Record<TaskStatus, "default" | "info" | "warning" | "danger" | "success"> = {
  Todo: "default",
  "In Progress": "info",
  Review: "warning",
  Blocked: "danger",
  Completed: "success",
};

const priorityVariant: Record<TaskPriority, "default" | "warning" | "danger"> = {
  Low: "default",
  Medium: "warning",
  High: "danger",
};

export const TasksPage = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin", "manager");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTasks = () => {
    setLoading(true);
    setError("");
    taskService
      .getAll()
      .then(setTasks)
      .catch(() => setError("Failed to load tasks. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

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
    if (!confirm("Delete this task?")) return;
    setDeletingId(id);
    try {
      await taskService.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch {
      alert("Failed to delete task.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(undefined);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
        {canManage && (
          <Button onClick={() => setModalOpen(true)}>+ New Task</Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}
          className="w-44"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
          className="w-44"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        {(search || statusFilter || priorityFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* States */}
      {loading && (
        <div className="flex justify-center pt-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}{" "}
          <button onClick={fetchTasks} className="underline font-medium">Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-10 text-center text-sm text-gray-400">
          {tasks.length === 0 ? "No tasks yet." : "No tasks match your filters."}
        </div>
      )}

      {/* Task List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm hover:shadow-md transition"
            >
              {/* Left */}
              <Link to={`/tasks/${task._id}`} className="flex-1 min-w-0 mr-4">
                <p className="font-medium text-gray-800 truncate">{task.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span>{task.project?.title}</span>
                  <span>·</span>
                  <span>
                    {task.assignedTo?.name ?? "Unassigned"}
                  </span>
                  <span>·</span>
                  <span>Due {formatDate(task.dueDate)}</span>
                </div>
              </Link>

              {/* Right */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
                <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>

                {canManage && (
                  <>
                    <button
                      onClick={() => handleEdit(task)}
                      className="ml-2 rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      disabled={deletingId === task._id}
                      className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === task._id ? "..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};
