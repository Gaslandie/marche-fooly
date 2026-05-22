/**
 * Route Handler: POST /api/auth/logout (interne Next.js — BFF)
 *
 * Rôle du fichier :
 *   Déconnecte l'utilisateur : prévient le backend (POST /api/auth/logout,
 *   au cas où une révocation y serait ajoutée plus tard) puis SUPPRIME le
 *   cookie de session httpOnly.
 *
 * Où il est utilisé :
 *   - Appelé par le bouton « Déconnexion » (AccountSidebar, bloc suivant)
 *     via `fetch("/api/auth/logout", { method: "POST" })`.
 *
 * Règles de sécurité :
 *   - L'appel backend est « best-effort » : même s'il échoue, on supprime
 *     quand même le cookie pour garantir la déconnexion locale.
 *   - Le token n'est jamais journalisé.
 *
 * Note pour GitHub Copilot :
 *   - Le logout backend est sans état (JWT pur) : la vraie déconnexion
 *     côté frontend = suppression du cookie httpOnly.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, backendJson, readAuthToken } from "@/lib/auth";

export async function POST() {
  const token = await readAuthToken();

  // Notification best-effort du backend (révocation future éventuelle).
  if (token) {
    try {
      await backendJson("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Échec ignoré volontairement : la déconnexion locale prime.
    }
  }

  // Suppression du cookie de session : c'est la déconnexion effective.
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);

  return NextResponse.json(
    { success: true, message: "Déconnexion effectuée" },
    { status: 200 },
  );
}
