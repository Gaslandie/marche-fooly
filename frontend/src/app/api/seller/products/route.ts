/**
 * Route Handler: POST /api/seller/products (interne Next.js — BFF)
 *
 * Rôle du fichier :
 *   Reçoit le formulaire de création produit du vendeur, sanitise les
 *   champs (whitelist + currency GNF + statut MVP), puis transmet au
 *   backend Express (POST /api/products) avec le JWT lu dans le cookie
 *   httpOnly.
 *
 * Où il est utilisé :
 *   - SellerProductForm (mode création, bloc suivant) via
 *     `fetch("/api/seller/products", { method: "POST" })`.
 *
 * Règles de sécurité :
 *   - JWT jamais exposé (cookie httpOnly -> Bearer côté serveur).
 *   - `sanitizeSellerProductInput` retire tout champ non autorisé
 *     (seller, slug, isFeatured, id, timestamps, version, rating...).
 *   - Le backend reste la source de vérité : il revalide l'autorisation
 *     (seller approved) et l'ownership. On relaie ses erreurs (403/422/
 *     409) sans détail technique ajouté.
 *
 * Note pour GitHub Copilot :
 *   - Réponse : `{ success, message, product }` (product pour rediriger).
 */

import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";
import { sanitizeSellerProductInput } from "@/lib/seller";

type BackendProductBody = {
  message?: string;
  data?: { product?: unknown };
};

export async function POST(request: Request) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", product: null },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", product: null },
      { status: 400 },
    );
  }

  const payload = sanitizeSellerProductInput(raw, { isCreate: true });

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson("/api/products", {
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
        message: body?.message ?? "Création du produit impossible",
        product: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Produit créé",
      product: body?.data?.product ?? null,
    },
    { status: 201 },
  );
}
