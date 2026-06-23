import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/store/notification.store";

const formatTime = (value: string) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const NotificationBellContent = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const latest = notifications.slice(0, 5);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/80 text-slate-700 shadow-sm backdrop-blur-xl transition hover:border-blue-200 hover:text-blue-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-14 z-50 w-[420px] overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-[0_28px_80px_rgba(15,23,42,0.22)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                <p className="text-xs text-slate-500">{unreadCount} unread</p>
              </div>
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark All Read
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {latest.length > 0 ? (
                latest.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={async () => {
                      await markRead(notification._id);
                      setOpen(false);
                      if (notification.link) navigate(notification.link);
                    }}
                    className={`block w-full border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-blue-50/60 ${
                      notification.isRead ? "bg-white" : "bg-blue-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                        <p className="text-sm text-slate-600">{notification.message}</p>
                        <p className="text-xs text-slate-400">{formatTime(notification.createdAt)}</p>
                      </div>
                      <ExternalLink className="mt-0.5 h-4 w-4 text-slate-300" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-medium text-slate-900">No notifications yet</p>
                  <p className="mt-1 text-sm text-slate-500">Activity from tasks, projects, and comments will appear here.</p>
                </div>
              )}
            </div>

              <div className="border-t border-slate-200/70 px-5 py-4">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="w-full rounded-2xl bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                View All Notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const NotificationBell = () => {
  try {
    return <NotificationBellContent />;
  } catch (error) {
    console.warn("NotificationBell error:", error);
    return (
      <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/80 text-slate-700 shadow-sm backdrop-blur-xl transition hover:border-blue-200 hover:text-blue-700">
        <Bell className="h-5 w-5" />
      </button>
    );
  }
};
