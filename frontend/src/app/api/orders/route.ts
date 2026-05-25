/**
 * Route Handler: POST /api/orders (interne Next.js — BFF)
 *
 * Rôle du fichier :
 *   Reçoit la requête de création de commande envoyée par le checkout
 *   et la TRANSMET au backend Express (POST /api/orders) en ajoutant
 *   le JWT lu dans le cookie httpOnly (en-tête `Authorization: Bearer`).
 *   Le navigateur n'a donc jamais accès au token.
 *
 * Où il est utilisé :
 *   - Appelé par le formulaire de checkout (CheckoutForm, bloc suivant)
 *     via `fetch("/api/orders", { method: "POST", body: ... })`.
 *
 * Règles de sécurité :
 *   - Le JWT reste côté serveur ; jamais renvoyé dans la réponse, jamais
 *     journalisé.
 *   - Sans cookie de session : 401 immédiat (pas d'appel backend inutile).
 *   - Les erreurs backend (422 validation / 409 stock / 403 vendeur...)
 *     sont relayées telles quelles avec leur `message`, sans détail
 *     technique ajouté.
 *
 * Règles métier :
 *   - Le client envoie strictement le payload accepté par le backend :
 *       { items, paymentMethod, fulfillmentMethod, customerPhone,
 *         shippingAddress?, notes? }
 *     Le backend recalcule prix, vendeur, stock, total — c'est la
 *     seule source de vérité.
 *
 * Note pour GitHub Copilot :
 *   - Réponse en cas de succès : `{ success, message, order }`
 *     (le navigateur reçoit l'objet `order` complet, dont la `reference`
 *     pour rediriger vers la page de confirmation).
 */

import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type BackendOrderBody = {
  message?: string;
  data?: { order?: unknown };
};

export async function POST(request: Request) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentification requise pour passer commande.",
        order: null,
      },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", order: null },
      { status: 400 },
    );
  }

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson("/api/orders", {
      method: "POST",
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
        message:
          "Service de commande indisponible. Réessayez dans un instant.",
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
        message: body?.message ?? "Création de commande impossible",
        order: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Commande créée",
      order: body?.data?.order ?? null,
    },
    { status: 201 },
  );
}
