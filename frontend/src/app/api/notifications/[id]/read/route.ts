import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

type BackendBody = {
  message?: string;
  data?: { notification?: unknown };
};

export async function PATCH(_request: Request, ctx: RouteContext) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", notification: null },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;

  try {
    const result = await backendJson(
      `/api/notifications/${encodeURIComponent(id)}/read`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const body = result.body as BackendBody | null;

    return NextResponse.json(
      {
        success: result.ok,
        message: body?.message ?? "Notification mise à jour",
        notification: body?.data?.notification ?? null,
      },
      { status: result.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service notifications indisponible.",
        notification: null,
      },
      { status: 503 },
    );
  }
}

