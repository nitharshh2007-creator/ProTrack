/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/store/auth.store";
import { notificationService } from "@/services";
import { closeSocket, getSocket } from "@/lib/socket";
import type { NotificationItem } from "@/types";

type ToastItem = {
  id: string;
  notification: NotificationItem;
};

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  toastQueue: ToastItem[];
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationState | null>(null);

const upsertNotification = (list: NotificationItem[], incoming: NotificationItem) => {
  const filtered = list.filter((item) => item._id !== incoming._id);
  return [incoming, ...filtered].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);

  const refresh = async () => {
    if (!token || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await notificationService.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [token, user?.id]);

  useEffect(() => {
    if (!token || !user) {
      closeSocket();
      return;
    }

    const socket = getSocket(token);
    socket.connect();

    const handleNew = (incoming: NotificationItem) => {
      setNotifications((prev) => upsertNotification(prev, incoming));
      setUnreadCount((prev) => prev + (incoming.isRead ? 0 : 1));
      setToastQueue((prev) => [{ id: crypto.randomUUID(), notification: incoming }, ...prev].slice(0, 3));
    };

    const handleUpdated = (incoming: NotificationItem) => {
      setNotifications((prev) => upsertNotification(prev, incoming));
      setUnreadCount((prev) => Math.max(0, prev + (incoming.isRead ? -1 : 0)));
    };

    const handleDeleted = (incoming: NotificationItem) => {
      setNotifications((prev) => prev.filter((item) => item._id !== incoming._id));
      setUnreadCount((prev) => (incoming.isRead ? prev : Math.max(0, prev - 1)));
    };

    socket.on("notification:new", handleNew);
    socket.on("notification:updated", handleUpdated);
    socket.on("notification:deleted", handleDeleted);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("notification:updated", handleUpdated);
      socket.off("notification:deleted", handleDeleted);
    };
  }, [token, user?.id]);

  const markRead = async (id: string) => {
    const updated = notifications.find((notification) => notification._id === id);
    if (!updated || updated.isRead) return;

    setNotifications((prev) =>
      prev.map((notification) =>
        notification._id === id ? { ...notification, isRead: true } : notification
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationService.markRead(id);
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    setUnreadCount(0);
    await notificationService.markAllRead();
  };

  const remove = async (id: string) => {
    const target = notifications.find((notification) => notification._id === id);
    setNotifications((prev) => prev.filter((notification) => notification._id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    await notificationService.remove(id);
  };

  const dismissToast = (id: string) => {
    setToastQueue((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (toastQueue.length === 0) return;

    const timer = window.setTimeout(() => {
      setToastQueue((prev) => prev.slice(0, -1));
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toastQueue]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refresh,
        markRead,
        markAllRead,
        remove,
        toastQueue,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};

export const NotificationToasts = () => {
  const { toastQueue, dismissToast } = useNotifications();

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toastQueue.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            className="pointer-events-auto rounded-2xl border border-blue-200/60 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{toast.notification.title}</p>
                <p className="mt-1 text-sm text-slate-600">{toast.notification.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
