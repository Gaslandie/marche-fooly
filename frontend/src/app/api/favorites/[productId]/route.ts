/**
 * Route Handler: DELETE /api/favorites/[productId] (interne — BFF)
 */

import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ productId: string }> };

type BackendFavoriteBody = {
  message?: string;
  data?: { removed?: boolean };
};

export async function DELETE(_request: Request, ctx: RouteContext) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", removed: false },
      { status: 401 },
    );
  }

  const { productId } = await ctx.params;

  try {
    const result = await backendJson(
      `/api/favorites/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const body = result.body as BackendFavoriteBody | null;

    return NextResponse.json(
      {
        success: result.ok,
        message: body?.message ?? "Favoris",
        removed: body?.data?.removed ?? false,
      },
      { status: result.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service favoris indisponible.",
        removed: false,
      },
      { status: 503 },
    );
  }
}
