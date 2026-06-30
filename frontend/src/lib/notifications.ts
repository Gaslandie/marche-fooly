/**
 * Lib serveur: notifications internes.
 * Lit les notifications via le backend avec le JWT httpOnly, sans exposer le
 * token au navigateur.
 */

import { backendJson, readAuthToken } from "@/lib/auth";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResult = {
  items: NotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type BackendNotificationListBody = {
  data?: NotificationListResult;
};

type BackendUnreadCountBody = {
  data?: { unreadCount?: number };
};

export async function getUnreadNotificationCount(): Promise<number> {
  const token = await readAuthToken();
  if (!token) return 0;

  try {
    const result = await backendJson("/api/notifications/unread-count", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return 0;
    const body = result.body as BackendUnreadCountBody | null;
    return body?.data?.unreadCount ?? 0;
  } catch {
    return 0;
  }
}

export async function getNotifications(
  params: { page?: number; limit?: number; unread?: boolean } = {},
): Promise<NotificationListResult | null> {
  const token = await readAuthToken();
  if (!token) return null;

  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.unread !== undefined) search.set("unread", String(params.unread));

  try {
    const qs = search.toString();
    const result = await backendJson(`/api/notifications${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return null;
    const body = result.body as BackendNotificationListBody | null;
    return body?.data ?? null;
  } catch {
    return null;
  }
}

