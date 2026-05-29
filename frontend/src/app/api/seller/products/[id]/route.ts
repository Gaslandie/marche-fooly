/**
 * Route Handler: PATCH & DELETE /api/seller/products/[id] (interne — BFF)
 *
 * Rôle du fichier :
 *   - PATCH  : modifie un produit (sanitise puis transmet à
 *     PATCH /api/products/:id).
 *   - DELETE : archive un produit (transmet à DELETE /api/products/:id,
 *     soft-delete côté backend).
 *   Authentifie via le cookie httpOnly (Bearer) — JWT jamais exposé.
 *
 * Où il est utilisé :
 *   - SellerProductForm (mode édition) et DeleteProductButton (bloc suivant).
 *
 * Règles de sécurité :
 *   - L'OWNERSHIP est garanti par le BACKEND : un vendeur ne peut
 *     modifier/supprimer QUE ses propres produits (sinon 403/404). On ne
 *     se fie jamais au frontend pour ça.
 *   - PATCH : `sanitizeSellerProductInput` retire les champs interdits
 *     (seller, slug, isFeatured, id, timestamps, version...) et force GNF.
 *   - Les erreurs backend (403/404/422/409) sont relayées telles quelles.
 *
 * Note pour GitHub Copilot :
 *   - `params` est une Promise (Next 15+) -> await.
 *   - DELETE = soft-delete (status archived) côté backend, idempotent.
 */

import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";
import { sanitizeSellerProductInput } from "@/lib/seller";

type RouteContext = { params: Promise<{ id: string }> };

type BackendProductBody = {
  message?: string;
  data?: { product?: unknown };
};

export async function PATCH(request: Request, ctx: RouteContext) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", product: null },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", product: null },
      { status: 400 },
    );
  }

  const payload = sanitizeSellerProductInput(raw, { isCreate: false });

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson(`/api/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service produits indisponible. Réessayez plus tard.",
        product: null,
      },
      { status: 503 },
    );
  }

  const body = result.body as BackendProductBody | null;
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Modification impossible",
        product: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Produit mis à jour",
      product: body?.data?.product ?? null,
    },
    { status: 200 },
  );
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise." },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson(`/api/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service produits indisponible. Réessayez plus tard.",
      },
      { status: 503 },
    );
  }

  const body = result.body as { message?: string } | null;
  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: body?.message ?? "Suppression impossible" },
      { status: result.status },
    );
  }

  return NextResponse.json(
    { success: true, message: body?.message ?? "Produit supprimé" },
    { status: 200 },
  );
}
