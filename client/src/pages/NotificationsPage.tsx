import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCheck, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/store/notification.store";
import type { NotificationItem, NotificationType } from "@/types";

const TYPE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Assignments", value: "assignments" },
  { label: "Comments", value: "comments" },
  { label: "Projects", value: "projects" },
  { label: "Files", value: "files" },
  { label: "Deadlines", value: "deadlines" },
] as const;

type FilterValue = (typeof TYPE_FILTERS)[number]["value"];
type SortValue = "newest" | "oldest";

const matchesFilter = (notification: NotificationItem, filter: FilterValue) => {
  if (filter === "all") return true;
  if (filter === "unread") return !notification.isRead;
  if (filter === "assignments") return ["task_assigned", "task_reassigned", "task_created", "task_completed", "task_updated", "user_added", "user_removed"].includes(notification.type);
  if (filter === "comments") return ["comment_added", "reply_added"].includes(notification.type);
  if (filter === "projects") return ["project_created", "project_updated"].includes(notification.type);
  if (filter === "files") return ["file_uploaded", "video_uploaded", "audio_uploaded"].includes(notification.type);
  if (filter === "deadlines") return ["deadline_reminder", "task_overdue"].includes(notification.type);
  return true;
};

const prettyType = (type: NotificationType) =>
  type
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markRead, markAllRead, remove } = useNotifications();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortValue>("newest");

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return notifications
      .filter((notification) => matchesFilter(notification, filter))
      .filter((notification) =>
        normalized
          ? `${notification.title} ${notification.message}`.toLowerCase().includes(normalized)
          : true
      )
      .sort((a, b) =>
        sort === "newest"
          ? +new Date(b.createdAt) - +new Date(a.createdAt)
          : +new Date(a.createdAt) - +new Date(b.createdAt)
      );
  }, [notifications, search, filter, sort]);

  const total = notifications.length;

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#101728] px-8 py-12 shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notifications</p>
          <h1 className="text-3xl font-bold text-white">Notification Center</h1>
          <p className="text-sm text-slate-400">Stay updated with project activity and team updates</p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md"
      >
        <div className="flex flex-col gap-4 w-full">
          <div className="w-full">
            <label className="sr-only" htmlFor="notification-search">Search notifications</label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 w-full">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                id="notification-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications"
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TYPE_FILTERS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === option.value
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {option.label}
              </button>
            ))}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 transition hover:bg-blue-100 dark:hover:bg-blue-500/30"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-sm text-slate-500 dark:text-slate-400 shadow-sm hover:shadow-md">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-8 text-sm font-medium text-red-700 dark:text-red-400 shadow-sm hover:shadow-md">
            {error}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((notification) => (
            <article
              key={notification._id}
              className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md ${
                notification.isRead ? "border-slate-200/70 dark:border-slate-800" : "border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-500/10"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {prettyType(notification.type)}
                    </span>
                    {!notification.isRead && (
                      <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        Unread
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{notification.title}</h2>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{notification.message}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatTime(notification.createdAt)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => void markRead(notification._id)}
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Mark read
                    </button>
                  )}
                  {notification.link && (
                    <button
                      onClick={() => navigate(notification.link!)}
                      className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Open
                    </button>
                  )}
                  <button
                    onClick={() => void remove(notification._id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[24px] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-10 text-center shadow-md">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No notifications found</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try a different filter, or wait for live activity to appear.
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
};
