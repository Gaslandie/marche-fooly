/**
 * Route Handler: PATCH /api/orders/[reference]/status (interne — BFF)
 *
 * Rôle du fichier :
 *   Transmet une transition de statut au backend
 *   (PATCH /api/orders/:reference/status) en ajoutant le JWT lu dans le
 *   cookie httpOnly. Utilisé par l'espace vendeur (changement de statut).
 *
 * Où il est utilisé :
 *   - components/seller/OrderStatusActions.tsx (bloc suivant).
 *
 * Règles de sécurité (IMPORTANT) :
 *   - JWT jamais exposé (cookie httpOnly -> Bearer côté serveur).
 *   - On ne transmet QUE `{ status, cancellationReason? }` (whitelist) :
 *     aucun autre champ du corps client n'est relayé. `cancelledBy` est
 *     dérivé du JWT côté backend, jamais accepté du client.
 *   - Le motif est obligatoire côté backend quand c'est le vendeur qui
 *     annule (422 relayé tel quel si absent).
 *   - Le backend reste la SOURCE DE VÉRITÉ : il revérifie l'acteur
 *     (ownership) ET la validité de la transition (machine d'état). On
 *     relaie ses codes : 422 (transition interdite), 403 (acteur non
 *     autorisé), 404 (introuvable/non visible), 409 (conflit de version).
 *
 * Note pour GitHub Copilot :
 *   - `params` est une Promise (Next 15+) -> await.
 *   - Réponse : `{ success, message, order }` (order pour rafraîchir l'UI).
 */

import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ reference: string }> };

type BackendOrderBody = {
  message?: string;
  data?: { order?: unknown };
};

export async function PATCH(request: Request, ctx: RouteContext) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", order: null },
      { status: 401 },
    );
  }

  const { reference } = await ctx.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", order: null },
      { status: 400 },
    );
  }

  // Whitelist stricte : `status` et, pour une annulation, le motif.
  const rawBody =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const status = rawBody.status;
  const rawReason = rawBody.cancellationReason;
  const cancellationReason =
    typeof rawReason === "string" ? rawReason.trim().slice(0, 300) : "";

  if (typeof status !== "string" || status.length === 0) {
    return NextResponse.json(
      { success: false, message: "Statut manquant ou invalide", order: null },
      { status: 400 },
    );
  }

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson(
      `/api/orders/${encodeURIComponent(reference)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          cancellationReason ? { status, cancellationReason } : { status },
        ),
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service indisponible. Réessayez plus tard.",
        order: null,
      },
      { status: 503 },
    );
  }

  const body = result.body as BackendOrderBody | null;
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Changement de statut impossible",
        order: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Statut mis à jour",
      order: body?.data?.order ?? null,
    },
    { status: 200 },
  );
}
