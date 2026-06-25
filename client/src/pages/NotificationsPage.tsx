import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCheck, Search, Trash2 } from "lucide-react";
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


  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-hero"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_45%)]" />
        <div className="relative space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">Notifications</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">Notification Center</h1>
          <p className="text-sm md:text-base text-[#CBD5E1] max-w-2xl leading-relaxed">Stay updated with project activity and team updates</p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg"
      >
        <div className="flex flex-col gap-4 w-full">
          <div className="w-full">
            <label className="sr-only" htmlFor="notification-search">Search notifications</label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 w-full">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                id="notification-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
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
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className="rounded-full border-0 bg-slate-950 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-slate-800 focus:ring-2 focus:ring-slate-700"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-2 rounded-full bg-blue-950/40 border border-blue-900/50 px-4 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-900/40"
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400 shadow-lg">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-sm font-medium text-red-450 shadow-lg">
            {error}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((notification) => (
            <article
              key={notification._id}
              className={`rounded-2xl border bg-slate-900 p-5 shadow-lg transition hover:shadow-xl ${
                notification.isRead ? "border-slate-800" : "border-blue-900 bg-blue-950/20"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
                      {prettyType(notification.type)}
                    </span>
                    {!notification.isRead && (
                      <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        Unread
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-white">{notification.title}</h2>
                  <p className="text-sm leading-6 text-slate-400">{notification.message}</p>
                  <p className="text-xs text-slate-500">{formatTime(notification.createdAt)}</p>
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
                  <button
                    onClick={() => void remove(notification._id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-950 bg-red-950/20 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-white">No notifications found</p>
            <p className="mt-2 text-sm text-slate-450">
              Try a different filter, or wait for live activity to appear.
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
};
