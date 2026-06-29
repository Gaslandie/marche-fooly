/**
 * Route Handler: PATCH /api/admin/sellers/[id]/status (interne — BFF)
 *
 * Rôle du fichier :
 *   Transmet l'action admin d'approbation/rejet/suspension d'un vendeur
 *   au backend (PATCH /api/admin/sellers/:id/status) en ajoutant le JWT
 *   lu dans le cookie httpOnly.
 *
 * Où il est utilisé :
 *   - components/admin/AdminSellerActions.tsx (bloc suivant).
 *
 * Règles de sécurité (IMPORTANT) :
 *   - JWT jamais exposé (cookie httpOnly -> Bearer côté serveur).
 *   - Whitelist stricte : seul `{ status }` est relayé.
 *   - Le backend impose les rôles owner/admin ET la logique métier
 *     (promotion de rôle à l'approbation). Il reste la SOURCE DE VÉRITÉ ;
 *     on relaie ses codes (401/403/404/422).
 *
 * Note pour GitHub Copilot :
 *   - `params` est une Promise (Next 15+) -> await.
 *   - `status` attendu ∈ { approved, rejected, suspended } (validé backend).
 */

import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

type BackendSellerBody = {
  message?: string;
  data?: { sellerProfile?: unknown };
};

export async function PATCH(request: Request, ctx: RouteContext) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", sellerProfile: null },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", sellerProfile: null },
      { status: 400 },
    );
  }

  const status =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>).status
      : undefined;

  if (typeof status !== "string" || status.length === 0) {
    return NextResponse.json(
      { success: false, message: "Statut manquant ou invalide", sellerProfile: null },
      { status: 400 },
    );
  }

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson(
      `/api/admin/sellers/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service indisponible. Réessayez plus tard.",
        sellerProfile: null,
      },
      { status: 503 },
    );
  }

  const body = result.body as BackendSellerBody | null;
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Action impossible",
        sellerProfile: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Statut vendeur mis à jour",
      sellerProfile: body?.data?.sellerProfile ?? null,
    },
    { status: 200 },
  );
}
