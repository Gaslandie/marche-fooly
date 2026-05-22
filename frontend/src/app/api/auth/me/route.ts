/**
 * Route Handler: GET /api/auth/me (interne Next.js — BFF)
 *
 * Rôle du fichier :
 *   Renvoie l'utilisateur connecté au navigateur, en validant la session
 *   côté serveur. La validation réelle est faite par le backend
 *   (GET /api/auth/me) à partir du token lu dans le cookie httpOnly.
 *
 * Où il est utilisé :
 *   - Côté client (blocs suivants) pour connaître l'état de connexion
 *     sans jamais accéder au token.
 *
 * Règles de sécurité :
 *   - Le token n'est jamais renvoyé : la réponse ne contient que `user`.
 *   - On ne fait pas confiance au navigateur : la session est toujours
 *     re-vérifiée auprès du backend (token expiré/invalide -> `user: null`).
 *   - `dynamic = "force-dynamic"` : cette route dépend du cookie de
 *     requête, elle ne doit jamais être mise en cache / pré-rendue.
 *
 * Note pour GitHub Copilot :
 *   - getCurrentUser() (src/lib/auth.ts) encapsule lecture cookie + appel
 *     backend ; il renvoie null pour tout échec (réseau, 401...).
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Non authentifié", user: null },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { success: true, message: "Utilisateur authentifié", user },
    { status: 200 },
  );
}
