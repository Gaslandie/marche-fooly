/**
 * Route Handler: POST /api/auth/forgot-password (interne Next.js — BFF)
 *
 * Rôle du fichier :
 *   Relaie la demande de réinitialisation de mot de passe au backend
 *   Express (POST /api/auth/forgot-password). Aucun cookie n'est
 *   manipulé ici : l'utilisateur n'est pas connecté.
 *
 * Où il est utilisé :
 *   - components/account/ForgotPasswordForm.tsx (page /mot-de-passe-oublie).
 *
 * Règles de sécurité :
 *   - Le backend répond un 200 générique que l'email existe ou non
 *     (anti-énumération) : on relaie tel quel.
 *   - 503 = envoi d'emails non configuré côté backend : le formulaire
 *     affiche alors les moyens de contact directs.
 */

import { NextResponse } from "next/server";
import { backendJson } from "@/lib/auth";

type BackendBody = { message?: string };

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide" },
      { status: 400 },
    );
  }

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service indisponible. Réessayez plus tard.",
      },
      { status: 503 },
    );
  }

  const body = result.body as BackendBody;
  return NextResponse.json(
    {
      success: result.ok,
      message:
        body?.message ??
        (result.ok ? "Demande envoyée." : "Demande impossible. Réessayez."),
    },
    { status: result.status },
  );
}
