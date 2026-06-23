import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/formatDate";
import { taskService, commentService } from "@/services";
import type { Task, Comment } from "@/types";
import { useAuth } from "@/store/auth.store";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { CommentList } from "@/components/comments/CommentList";
import { CommentForm } from "@/components/comments/CommentForm";
import {
  ArrowLeft, Circle, Flag, User, Calendar, FolderKanban, Clock,
  Pencil, X, Undo2, Redo2, Minus, Square, Eraser, Download,
  MessageSquare, Activity, Paperclip,
} from "lucide-react";

// ── Status / Priority helpers ────────────────────────────────────────────────
const statusVariant = {
  Todo: "default", "In Progress": "info", Review: "warning",
  Blocked: "danger", Completed: "success",
} as const;

const priorityVariant = { Low: "default", Medium: "warning", High: "danger" } as const;

const statusDot: Record<string, string> = {
  Todo: "bg-slate-400", "In Progress": "bg-blue-500",
  Review: "bg-amber-500", Blocked: "bg-red-500", Completed: "bg-emerald-500",
};

const priorityColor: Record<string, string> = {
  Low: "text-slate-500", Medium: "text-amber-500", High: "text-red-500",
};

// ── Avatar helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500"];
const Avatar = ({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) => {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const sz = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${color} ${sz}`}>
      {initials}
    </div>
  );
};

// ── Sidebar info card ────────────────────────────────────────────────────────
const InfoCard = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400 dark:text-slate-500">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{label}</span>
    </div>
    <div className="text-sm text-gray-800 dark:text-slate-200">{children}</div>
  </div>
);

// ── Progress bar ─────────────────────────────────────────────────────────────
const progressByStatus: Record<string, number> = {
  Todo: 0, "In Progress": 40, Review: 70, Blocked: 30, Completed: 100,
};

// ── Drawing / Sketch Modal ───────────────────────────────────────────────────
const SketchModal = ({ onClose }: { onClose: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser" | "rect" | "line">("pen");
  const [color, setColor] = useState("#2563eb");
  const [size, setSize] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);
  const drawing = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  const save = () => {
    const c = canvasRef.current;
    const g = ctx();
    if (!c || !g) return;
    setHistory((h) => [...h, g.getImageData(0, 0, c.width, c.height)]);
    setFuture([]);
  };

  const undo = () => {
    const c = canvasRef.current; const g = ctx();
    if (!c || !g || history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [g.getImageData(0, 0, c.width, c.height), ...f]);
    setHistory((h) => h.slice(0, -1));
    g.putImageData(prev, 0, 0);
  };

  const redo = () => {
    const c = canvasRef.current; const g = ctx();
    if (!c || !g || future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, g.getImageData(0, 0, c.width, c.height)]);
    setFuture((f) => f.slice(1));
    g.putImageData(next, 0, 0);
  };

  const getPos = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    save();
    drawing.current = true;
    const p = getPos(e);
    origin.current = p;
    const g = ctx();
    if (!g) return;
    g.beginPath();
    g.moveTo(p.x, p.y);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drawing.current) return;
    const g = ctx(); if (!g) return;
    const p = getPos(e);
    if (tool === "pen") {
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = color; g.lineWidth = size; g.lineCap = "round";
      g.lineTo(p.x, p.y); g.stroke();
    } else if (tool === "eraser") {
      g.globalCompositeOperation = "destination-out";
      g.lineWidth = size * 4; g.lineCap = "round";
      g.lineTo(p.x, p.y); g.stroke();
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    const g = ctx(); if (!g) return;
    const p = getPos(e);
    g.globalCompositeOperation = "source-over";
    if (tool === "rect") {
      g.strokeStyle = color; g.lineWidth = size;
      g.strokeRect(origin.current.x, origin.current.y, p.x - origin.current.x, p.y - origin.current.y);
    } else if (tool === "line") {
      g.strokeStyle = color; g.lineWidth = size; g.lineCap = "round";
      g.beginPath(); g.moveTo(origin.current.x, origin.current.y);
      g.lineTo(p.x, p.y); g.stroke();
    }
    drawing.current = false;
  };

  const download = () => {
    const c = canvasRef.current; if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "sketch.png";
    a.click();
  };

  const COLORS = ["#2563eb","#10b981","#f59e0b","#ef4444","#8b5cf6","#0f172a","#ffffff"];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-5 py-3">
          <span className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-600" /> Sketch Canvas
          </span>
          <div className="flex items-center gap-2">
            <button onClick={download} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex-wrap">
          {([["pen","Pen",<Pencil className="h-3.5 w-3.5"/>],["eraser","Eraser",<Eraser className="h-3.5 w-3.5"/>],["rect","Rect",<Square className="h-3.5 w-3.5"/>],["line","Line",<Minus className="h-3.5 w-3.5"/>]] as [string,string,React.ReactNode][]).map(([t, label, icon]) => (
            <button key={t} onClick={() => setTool(t as typeof tool)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${tool === t ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600"}`}>
              {icon}{label}
            </button>
          ))}
          <div className="h-4 w-px bg-gray-200 dark:bg-slate-600 mx-1" />
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              style={{ background: c }}
              className={`h-5 w-5 rounded-full border-2 transition ${color === c ? "border-blue-500 scale-125" : "border-gray-200 dark:border-slate-600"}`}
            />
          ))}
          <div className="h-4 w-px bg-gray-200 dark:bg-slate-600 mx-1" />
          <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(+e.target.value)} className="w-20 accent-blue-600" />
          <div className="ml-auto flex gap-1">
            <button onClick={undo} disabled={history.length === 0} className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"><Undo2 className="h-3.5 w-3.5"/></button>
            <button onClick={redo} disabled={future.length === 0} className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"><Redo2 className="h-3.5 w-3.5"/></button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef} width={672} height={400}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          className="block w-full cursor-crosshair bg-white dark:bg-slate-900"
          style={{ touchAction: "none" }}
        />
      </motion.div>
    </motion.div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskError, setTaskError] = useState("");

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
  const [showSketch, setShowSketch] = useState(false);

  useEffect(() => {
    if (!id) return;
    setTaskLoading(true);
    taskService.getById(id)
      .then(setTask)
      .catch(() => setTaskError("Failed to load task."))
      .finally(() => setTaskLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setCommentsLoading(true);
    commentService.getByTask(id)
      .then(setComments)
      .catch(() => setCommentsError("Failed to load comments."))
      .finally(() => setCommentsLoading(false));
  }, [id]);

  const handleCommentAdded = (c: Comment) => setComments((prev) => [c, ...prev]);

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      await commentService.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } finally {
      setDeletingId(null);
    }
  };

  if (taskLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;
  if (taskError) return <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">{taskError}</div>;
  if (!task) return null;

  const progress = progressByStatus[task.status] ?? 0;

  // Build activity from comments (sorted by date)
  const activityItems = [
    { id: "created", label: `${task.createdBy?.name ?? "Someone"} created this task`, date: task.createdAt, type: "task" },
    ...comments.map((c) => ({ id: c._id, label: `${c.user.name} commented`, date: c.createdAt, type: "comment" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <AnimatePresence>{showSketch && <SketchModal onClose={() => setShowSketch(false)} />}</AnimatePresence>

      <div className="mx-auto max-w-6xl space-y-6 pb-12">

        {/* ── Back ── */}
        <Link to="/tasks" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Link>

        {/* ── Hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 p-6 shadow-sm"
        >
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 leading-tight flex-1">{task.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
              <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400 mb-6 max-w-3xl">{task.description}</p>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-3 border-t border-gray-50 dark:border-slate-800 pt-4">
            <Pill icon={<Circle className={`h-3 w-3 fill-current ${statusDot[task.status].replace("bg-","text-")}`} />} label={task.status} />
            <Pill icon={<Flag className={`h-3.5 w-3.5 ${priorityColor[task.priority]}`} />} label={task.priority} />
            <Pill icon={<User className="h-3.5 w-3.5 text-gray-400" />} label={task.assignedTo?.name ?? "—"} />
            <Pill icon={<Calendar className="h-3.5 w-3.5 text-gray-400" />} label={`Due ${formatDate(task.dueDate)}`} />
            <Pill icon={<Clock className="h-3.5 w-3.5 text-gray-400" />} label={`Created ${formatDate(task.createdAt)}`} />
            <Pill icon={<FolderKanban className="h-3.5 w-3.5 text-gray-400" />} label={task.project?.title ?? "—"} />
          </div>
        </motion.div>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

          {/* ── LEFT: Activity / Comments ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            {/* Tab header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-5 py-3">
              <div className="flex gap-1">
                {(["comments", "activity"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      activeTab === tab ? "bg-blue-600 text-white" : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}>
                    {tab === "comments" ? (
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Comments {!commentsLoading && comments.length > 0 && <span className="ml-0.5 rounded-full bg-white/30 px-1.5 py-0.5 text-[10px]">{comments.length}</span>}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Activity</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sketch button */}
              <button onClick={() => setShowSketch(true)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                <Pencil className="h-3.5 w-3.5" /> Sketch
              </button>
            </div>

            <div className="p-5">
              {activeTab === "comments" ? (
                <div className="space-y-5">
                  <CommentForm taskId={task._id} onAdded={handleCommentAdded} />
                  <CommentList
                    comments={comments} loading={commentsLoading}
                    error={commentsError} deletingId={deletingId} onDelete={handleDeleteComment}
                  />
                </div>
              ) : (
                <div className="relative pl-4">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100 dark:bg-slate-800" />
                  <div className="flex flex-col gap-4">
                    {activityItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className={`relative z-10 mt-0.5 h-3.5 w-3.5 rounded-full border-2 border-white shrink-0 ${
                          item.type === "task" ? "bg-blue-500" : "bg-emerald-400"
                        }`} />
                        <div>
                          <p className="text-sm text-gray-700 dark:text-slate-200">{item.label}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">
                            {new Date(item.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── RIGHT: Sidebar ── */}
          <motion.div
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {/* Status */}
            <InfoCard label="Status" icon={<Circle className="h-4 w-4" />}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDot[task.status]}`} />
                <span className="dark:text-slate-200">{task.status}</span>
              </div>
            </InfoCard>

            {/* Priority */}
            <InfoCard label="Priority" icon={<Flag className="h-4 w-4" />}>
              <span className={`font-semibold ${priorityColor[task.priority]}`}>{task.priority}</span>
            </InfoCard>

            {/* Assignee */}
            <InfoCard label="Assignee" icon={<User className="h-4 w-4" />}>
              <div className="flex items-center gap-2">
                <Avatar name={task.assignedTo?.name ?? "?"} size="sm" />
                <span className="dark:text-slate-200">{task.assignedTo?.name ?? "—"}</span>
              </div>
            </InfoCard>

            {/* Due Date */}
            <InfoCard label="Due Date" icon={<Calendar className="h-4 w-4" />}>
              {formatDate(task.dueDate)}
            </InfoCard>

            {/* Project */}
            <InfoCard label="Project" icon={<FolderKanban className="h-4 w-4" />}>
              {task.project?.title ?? "—"}
            </InfoCard>

            {/* Progress */}
            <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Progress</span>
                <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Team card */}
            <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 block mb-3">Team</span>
              <div className="flex items-center gap-2">
                <Avatar name={task.assignedTo?.name ?? "?"} size="md" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{task.assignedTo?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Assignee</p>
                </div>
              </div>
              {task.createdBy && task.createdBy._id !== task.assignedTo?._id && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                  <Avatar name={task.createdBy.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{task.createdBy.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Created by</p>
                  </div>
                </div>
              )}
            </div>

            {/* Attachment counter from comments count */}
            <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Activity</span>
              </div>
              <div className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-slate-200">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Comments</span>
                  <span className="font-semibold">{commentsLoading ? "…" : comments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Created by</span>
                  <span className="font-semibold">{task.createdBy?.name ?? "—"}</span>
                </div>
                {authUser && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Viewing as</span>
                    <span className="font-semibold">{authUser.name}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

// ── Pill helper ──────────────────────────────────────────────────────────────
const Pill = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-3 py-1 text-xs text-gray-600 dark:text-slate-300 font-medium">
    {icon}{label}
  </span>
);
