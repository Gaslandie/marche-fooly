/**
 * Lib: auth (MODULE SERVEUR UNIQUEMENT)
 *
 * Rôle du fichier :
 *   Fondations de l'authentification côté frontend :
 *     1. constantes et options du cookie de session (httpOnly) ;
 *     2. lecture du token de session (usage interne serveur) ;
 *     3. `getCurrentUser()` : récupère l'utilisateur connecté en
 *        validant la session auprès du backend (GET /api/auth/me) ;
 *     4. `backendJson()` : helper d'appel JSON vers le backend Express.
 *
 * Où il est utilisé :
 *   - app/api/auth/* (Route Handlers register/login/me/logout)
 *   - plus tard : Server Components des pages protégées (mon-compte,
 *     commandes) pour vérifier la session côté serveur.
 *
 * Règles de sécurité (IMPORTANT) :
 *   - Ce module est SERVEUR UNIQUEMENT. Il importe `next/headers`, qui
 *     lève une erreur s'il est importé dans un Client Component : c'est
 *     la garde qui empêche ce code d'arriver dans le bundle navigateur.
 *   - Le token (JWT) ne doit JAMAIS être renvoyé au navigateur, ni
 *     écrit dans le DOM, ni journalisé. Il reste dans le cookie
 *     httpOnly et n'est lu que pour être transmis au backend en
 *     en-tête `Authorization: Bearer`.
 *   - Ne jamais faire `console.log(token)`.
 *
 * Note pour GitHub Copilot :
 *   - Cookie : httpOnly, sameSite "lax", path "/", secure en production
 *     seulement (sinon le cookie ne se pose pas en HTTP local),
 *     maxAge 7 jours (aligné sur l'expiration du JWT backend).
 */

import { cookies } from "next/headers";
import type { AuthUser } from "@/types/auth";

/** Nom du cookie de session (contient le JWT, httpOnly). */
export const AUTH_COOKIE_NAME = "mf_session";

/** Durée de vie du cookie en secondes : 7 jours (aligné sur le JWT backend). */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** URL de base du backend Express, sans slash final. */
export function getBackendUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  return raw.replace(/\/+$/, "");
}

/**
 * Options du cookie de session, à passer à `cookieStore.set(...)`.
 * `secure` n'est activé qu'en production : en développement (HTTP),
 * un cookie `secure` ne serait pas accepté par le navigateur.
 */
export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

/**
 * Lit le token de session depuis le cookie httpOnly.
 * USAGE INTERNE SERVEUR : la valeur ne doit jamais ressortir vers le client.
 */
export async function readAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * Appel JSON générique vers le backend Express.
 * `cache: "no-store"` : les données d'auth ne doivent jamais être mises
 * en cache. Renvoie le statut HTTP et le corps JSON (ou null si illisible).
 */
export async function backendJson(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; ok: boolean; body: unknown }> {
  const res = await fetch(`${getBackendUrl()}${path}`, {
    ...init,
    cache: "no-store",
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
}

/**
 * Récupère l'utilisateur connecté en validant la session côté serveur :
 * lit le cookie, interroge GET /api/auth/me du backend.
 *
 * @returns l'utilisateur si la session est valide, sinon `null`.
 *          Ne lève jamais : toute erreur (réseau, token expiré...) est
 *          traitée comme « non connecté ».
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await readAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { user?: AuthUser } };
    return body?.data?.user ?? null;
  } catch {
    return null;
  }
}
