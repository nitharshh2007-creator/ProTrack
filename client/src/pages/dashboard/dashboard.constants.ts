import {
  Activity,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  MessageSquare,
  Paperclip,
  UserPlus,
} from "lucide-react";

export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export const chartColors: Record<string, string> = {
  Todo: "#2563eb",
  "In Progress": "#8b5cf6",
  Review: "#f59e0b",
  Blocked: "#ef4444",
  Completed: "#10b981",
};

export const activityIconMap: Record<string, typeof Activity> = {
  project_created: FolderKanban,
  project_updated: Briefcase,
  task_created: ListTodo,
  task_assigned: UserPlus,
  task_reassigned: UserPlus,
  task_completed: CheckCircle2,
  task_updated: Activity,
  comment_added: MessageSquare,
  reply_added: MessageSquare,
  file_uploaded: Paperclip,
  video_uploaded: Paperclip,
  audio_uploaded: Paperclip,
  deadline_reminder: Clock3,
  task_overdue: AlertTriangle,
  user_added: UserPlus,
  user_removed: UserPlus,
};

export const activityToneMap: Record<string, string> = {
  project_created: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  project_updated: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  task_created: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  task_assigned: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  task_reassigned: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  task_completed: "bg-green-500/10 text-green-600 border-green-500/20",
  task_updated: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  comment_added: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  reply_added: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  file_uploaded: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  video_uploaded: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  audio_uploaded: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  deadline_reminder: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  task_overdue: "bg-red-500/10 text-red-600 border-red-500/20",
  user_added: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  user_removed: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
