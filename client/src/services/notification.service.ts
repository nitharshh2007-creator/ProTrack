import api from "@/lib/axios";
import type { NotificationItem, NotificationSummary } from "@/types";

export const notificationService = {
  getAll: () =>
    api.get<{ notifications: NotificationItem[]; unreadCount: number }>("/notifications").then((r) => r.data),

  getSummary: () =>
    api.get<NotificationSummary>("/notifications/summary").then((r) => r.data),

  markRead: (id: string) =>
    api.patch<{ message: string; notification: NotificationItem }>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.patch<{ message: string }>("/notifications/read-all").then((r) => r.data),

  remove: (id: string) =>
    api.delete<{ message: string }>(`/notifications/${id}`).then((r) => r.data),
};
