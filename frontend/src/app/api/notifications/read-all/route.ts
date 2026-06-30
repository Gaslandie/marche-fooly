import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type BackendBody = {
  message?: string;
  data?: { modifiedCount?: number };
};

export async function PATCH() {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentification requise.",
        modifiedCount: 0,
      },
      { status: 401 },
    );
  }

  try {
    const result = await backendJson("/api/notifications/read-all", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = result.body as BackendBody | null;

    return NextResponse.json(
      {
        success: result.ok,
        message: body?.message ?? "Notifications mises à jour",
        modifiedCount: body?.data?.modifiedCount ?? 0,
      },
      { status: result.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service notifications indisponible.",
        modifiedCount: 0,
      },
      { status: 503 },
    );
  }
}

