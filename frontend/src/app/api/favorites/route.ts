/**
 * Route Handler: /api/favorites (interne Next.js — BFF)
 *
 * Le JWT reste dans le cookie httpOnly. Le navigateur appelle cette route,
 * puis Next.js transmet l'autorisation au backend.
 */

import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type BackendFavoriteBody = {
  message?: string;
  data?: { favorite?: unknown; items?: unknown[]; pagination?: unknown };
};

export async function GET(request: Request) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentification requise.",
        items: [],
        pagination: null,
      },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const query = url.search ? url.search : "";

  try {
    const result = await backendJson(`/api/favorites${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = result.body as BackendFavoriteBody | null;

    return NextResponse.json(
      {
        success: result.ok,
        message: body?.message ?? "Favoris",
        items: body?.data?.items ?? [],
        pagination: body?.data?.pagination ?? null,
      },
      { status: result.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service favoris indisponible.",
        items: [],
        pagination: null,
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", favorite: null },
      { status: 401 },
    );
  }

  let payload: { productId?: unknown } | null = null;
  try {
    payload = (await request.json()) as { productId?: unknown };
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", favorite: null },
      { status: 400 },
    );
  }

  if (typeof payload?.productId !== "string") {
    return NextResponse.json(
      { success: false, message: "Produit invalide", favorite: null },
      { status: 400 },
    );
  }

  try {
    const result = await backendJson("/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product: payload.productId }),
    });
    const body = result.body as BackendFavoriteBody | null;

    return NextResponse.json(
      {
        success: result.ok,
        message: body?.message ?? "Favoris",
        favorite: body?.data?.favorite ?? null,
      },
      { status: result.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Service favoris indisponible.", favorite: null },
      { status: 503 },
    );
  }
}
