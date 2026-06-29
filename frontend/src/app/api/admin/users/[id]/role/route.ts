import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

type BackendUserBody = {
  message?: string;
  data?: { user?: unknown };
};

export async function PATCH(request: Request, ctx: RouteContext) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", user: null },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", user: null },
      { status: 400 },
    );
  }

  const role =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>).role
      : undefined;

  if (typeof role !== "string" || role.length === 0) {
    return NextResponse.json(
      { success: false, message: "Rôle manquant ou invalide", user: null },
      { status: 400 },
    );
  }

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson(
      `/api/admin/users/${encodeURIComponent(id)}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service indisponible. Réessayez plus tard.",
        user: null,
      },
      { status: 503 },
    );
  }

  const body = result.body as BackendUserBody | null;
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Action impossible",
        user: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Rôle utilisateur mis à jour",
      user: body?.data?.user ?? null,
    },
    { status: 200 },
  );
}
