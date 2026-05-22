/**
 * Route Handler: POST /api/auth/login (interne Next.js — BFF)
 *
 * Rôle du fichier :
 *   Reçoit le formulaire de connexion du navigateur, le transmet au
 *   backend Express (POST /api/auth/login). En cas de succès, stocke le
 *   JWT dans un cookie httpOnly et ne renvoie au navigateur que
 *   l'utilisateur — JAMAIS le token.
 *
 * Où il est utilisé :
 *   - Appelé par le formulaire de connexion (AuthTabs, bloc suivant)
 *     via `fetch("/api/auth/login")`.
 *
 * Règles de sécurité :
 *   - Le token reste côté serveur (cookie httpOnly), jamais renvoyé ni
 *     journalisé.
 *   - Le backend renvoie un message générique « Email ou mot de passe
 *     incorrect » (anti-énumération) : on le relaie tel quel.
 *
 * Note pour GitHub Copilot :
 *   - Backend en cas de succès : 200 { data: { user, token } }.
 *   - 401 = identifiants invalides ; 403 = compte suspendu.
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
    result = await backendJson("/api/auth/login", {
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

  // Échec backend (401 identifiants invalides, 403 suspendu...) :
  // on relaie le message générique du backend, sans poser de cookie.
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Connexion impossible",
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
    { success: true, message: body?.message ?? "Connexion réussie", user },
    { status: 200 },
  );
}
