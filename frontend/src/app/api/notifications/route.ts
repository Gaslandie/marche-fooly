import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type BackendNotificationBody = {
  message?: string;
  data?: {
    items?: unknown[];
    unreadCount?: number;
    pagination?: unknown;
  };
};

export async function GET(request: Request) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentification requise.",
        items: [],
        unreadCount: 0,
        pagination: null,
      },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const query = url.search || "";

  try {
    const result = await backendJson(`/api/notifications${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = result.body as BackendNotificationBody | null;

    return NextResponse.json(
      {
        success: result.ok,
        message: body?.message ?? "Notifications",
        items: body?.data?.items ?? [],
        unreadCount: body?.data?.unreadCount ?? 0,
        pagination: body?.data?.pagination ?? null,
      },
      { status: result.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service notifications indisponible.",
        items: [],
        unreadCount: 0,
        pagination: null,
      },
      { status: 503 },
    );
  }
}

