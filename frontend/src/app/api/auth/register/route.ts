/**
 * Route Handler: POST /api/auth/register (interne Next.js — BFF)
 *
 * Rôle du fichier :
 *   Reçoit le formulaire d'inscription du navigateur, le transmet au
 *   backend Express (POST /api/auth/register). En cas de succès, stocke
 *   le JWT dans un cookie httpOnly et ne renvoie au navigateur que
 *   l'utilisateur — JAMAIS le token.
 *
 * Où il est utilisé :
 *   - Appelé par le formulaire d'inscription (AuthTabs, bloc suivant)
 *     via `fetch("/api/auth/register")`.
 *
 * Règles de sécurité :
 *   - Le token reste côté serveur : posé dans un cookie httpOnly, jamais
 *     renvoyé dans le corps de la réponse, jamais journalisé.
 *   - Les erreurs backend (409 conflit, 422 validation...) sont relayées
 *     telles quelles, avec leur message, sans détail technique ajouté.
 *
 * Note pour GitHub Copilot :
 *   - Backend en cas de succès : 201 { data: { user, token } }.
 *   - Options du cookie centralisées dans src/lib/auth.ts.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  backendJson,
} from "@/lib/auth";

type BackendAuthBody = {
  message?: string;
  data?: { user?: unknown; token?: string };
};

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", user: null },
      { status: 400 },
    );
  }

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service d'authentification indisponible. Réessayez plus tard.",
        user: null,
      },
      { status: 503 },
    );
  }

  const body = result.body as BackendAuthBody;

  // Échec backend (409 email/téléphone déjà pris, 422 validation...) :
  // on relaie le message tel quel, sans poser de cookie.
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Inscription impossible",
        user: null,
      },
      { status: result.status },
    );
  }

  // Succès : on pose le JWT dans le cookie httpOnly et on ne renvoie
  // que l'utilisateur.
  const token = body?.data?.token;
  const user = body?.data?.user ?? null;
  if (token) {
    const store = await cookies();
    store.set(AUTH_COOKIE_NAME, token, authCookieOptions());
  }

  return NextResponse.json(
    { success: true, message: body?.message ?? "Compte créé avec succès", user },
    { status: 201 },
  );
}
