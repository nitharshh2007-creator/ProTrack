import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatDate } from "@/lib/formatDate";
import { taskService, commentService } from "@/services";
import type { Task, Comment } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { CommentList } from "@/components/comments/CommentList";
import { CommentForm } from "@/components/comments/CommentForm";

const statusVariant = {
  Todo: "default",
  "In Progress": "info",
  Review: "warning",
  Blocked: "danger",
  Completed: "success",
} as const;

const priorityVariant = {
  Low: "default",
  Medium: "warning",
  High: "danger",
} as const;

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
    <span className="text-sm text-gray-800">{value}</span>
  </div>
);

export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  // Task state
  const [task, setTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskError, setTaskError] = useState("");

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch task
  useEffect(() => {
    if (!id) return;
    setTaskLoading(true);
    setTaskError("");
    taskService
      .getById(id)
      .then(setTask)
      .catch(() => setTaskError("Failed to load task. Please try again."))
      .finally(() => setTaskLoading(false));
  }, [id]);

  // Fetch comments
  useEffect(() => {
    if (!id) return;
    setCommentsLoading(true);
    setCommentsError("");
    commentService
      .getByTask(id)
      .then(setComments)
      .catch(() => setCommentsError("Failed to load comments."))
      .finally(() => setCommentsLoading(false));
  }, [id]);

  const handleCommentAdded = (comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      await commentService.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      // keep comment in list if delete fails
    } finally {
      setDeletingId(null);
    }
  };

  // ── Task loading ──────────────────────────────────────────────
  if (taskLoading) {
    return (
      <div className="flex justify-center pt-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (taskError) {
    return (
      <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
        {taskError}
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* ── Back ── */}
      <Link to="/tasks" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition">
        ← Back to Tasks
      </Link>

      {/* ── Task Details Card ── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {/* Title + Badges */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
            <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
          </div>
        </div>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-gray-600">{task.description}</p>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
          <DetailRow label="Project" value={task.project?.title ?? "—"} />
          <DetailRow label="Assigned To" value={task.assignedTo?.name ?? "—"} />
          <DetailRow label="Created By" value={task.createdBy?.name ?? "—"} />
          <DetailRow label="Start Date" value={formatDate(task.startDate)} />
          <DetailRow label="Due Date" value={formatDate(task.dueDate)} />
          <DetailRow label="Created" value={formatDate(task.createdAt)} />
        </div>
      </div>

      {/* ── Comments Section ── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-gray-800">
          Discussion
          {!commentsLoading && comments.length > 0 && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              {comments.length}
            </span>
          )}
        </h2>

        {/* Add Comment */}
        <div className="mb-6">
          <CommentForm taskId={task._id} onAdded={handleCommentAdded} />
        </div>

        {/* Comment List */}
        <CommentList
          comments={comments}
          loading={commentsLoading}
          error={commentsError}
          deletingId={deletingId}
          onDelete={handleDeleteComment}
        />
      </div>

    </div>
  );
};
