/**
 * Route Handler: POST /api/auth/reset-password (interne Next.js — BFF)
 *
 * Rôle du fichier :
 *   Relaie la définition du nouveau mot de passe au backend Express
 *   (POST /api/auth/reset-password) avec le token à usage unique reçu
 *   par email. Aucun cookie n'est posé : après succès, l'utilisateur se
 *   connecte normalement avec son nouveau mot de passe.
 *
 * Où il est utilisé :
 *   - components/account/ResetPasswordForm.tsx
 *     (page /reinitialiser-mot-de-passe).
 *
 * Règles de sécurité :
 *   - Le token ne transite que dans le corps de ce POST interne ; il
 *     n'est ni journalisé ni stocké côté Next.
 *   - 400 = lien invalide/expiré ; 403 = compte suspendu.
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
    result = await backendJson("/api/auth/reset-password", {
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
        (result.ok
          ? "Mot de passe mis à jour."
          : "Réinitialisation impossible. Réessayez."),
    },
    { status: result.status },
  );
}
