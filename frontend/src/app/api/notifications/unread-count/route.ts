import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type BackendUnreadBody = {
  message?: string;
  data?: { unreadCount?: number };
};

export async function GET() {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", unreadCount: 0 },
      { status: 401 },
    );
  }

  try {
    const result = await backendJson("/api/notifications/unread-count", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = result.body as BackendUnreadBody | null;

    return NextResponse.json(
      {
        success: result.ok,
        message: body?.message ?? "Compteur notifications",
        unreadCount: body?.data?.unreadCount ?? 0,
      },
      { status: result.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service notifications indisponible.",
        unreadCount: 0,
      },
      { status: 503 },
    );
  }
}

