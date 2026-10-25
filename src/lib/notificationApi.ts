import { request } from "./api";
import type { Paged } from "./organizerApi";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  content?: string | null;
  isRead: boolean;
  actorName?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}

// The backend only returns the realtime (in-app) notifications of the current user.
export const notificationApi = {
  list: async (params: { isRead?: boolean; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<AppNotification>>("/notifications", { auth: true, query: params });
    return data!;
  },

  unreadCount: async () => {
    const { data } = await request<{ unreadCount: number }>("/notifications/unread-count", { auth: true });
    return data?.unreadCount ?? 0;
  },

  markRead: (id: string) => request(`/notifications/${id}/read`, { method: "PUT", auth: true }),

  markAllRead: () => request("/notifications/read", { method: "PUT", body: { markAll: true }, auth: true }),
};
