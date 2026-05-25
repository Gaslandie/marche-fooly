/**
 * Lib: cart — utilitaires purs côté panier
 *
 * Rôle du fichier :
 *   Constantes et fonctions pures (sans état) pour le panier :
 *     - clé `localStorage`, bornes de quantité, taille max ;
 *     - `clampQuantity()` : normalisation entier ∈ [MIN, MAX] ;
 *     - `getCurrentSellerSlug()` : vendeur courant (mono-vendeur) ;
 *     - `isValidLine()` / `safeParseStored()` : parsing défensif des
 *       données issues de `localStorage` (résiliant aux altérations).
 *
 * Où il est utilisé :
 *   - src/components/cart/CartProvider.tsx
 *   - Plus tard : tests / helpers UI panier.
 *
 * Règles métier :
 *   - Quantité d'une ligne : entier dans [1, 100] (aligné backend qui
 *     accepte 1..100 par item).
 *   - Nombre de lignes : max 50 (aligné backend `items: max 50`).
 *   - Mono-vendeur : déduit du premier item présent.
 *
 * Note pour GitHub Copilot :
 *   - Ces fonctions sont PURES (pas de side-effect, pas de fetch).
 *   - Tout effet de bord (localStorage, setState) reste dans le Provider.
 */

import type { CartLine, CartState } from "@/types/cart";

/** Clé `localStorage` du panier (versionnée pour migration future). */
export const CART_STORAGE_KEY = "mf_cart_v1";

/** Nombre maximum de lignes (aligné backend : `items` max 50). */
export const CART_MAX_LINES = 50;

/** Quantité minimale d'une ligne. */
export const CART_MIN_QTY = 1;

/** Quantité maximale d'une ligne (aligné backend : `quantity` max 100). */
export const CART_MAX_QTY = 100;

/** État vide réutilisable (référentiel stable pour le state initial). */
export const EMPTY_CART: CartState = { lines: [] };

/** Borne et normalise une quantité (entier ∈ [MIN, MAX]). */
export function clampQuantity(qty: number): number {
  if (!Number.isFinite(qty)) return CART_MIN_QTY;
  const int = Math.floor(qty);
  if (int < CART_MIN_QTY) return CART_MIN_QTY;
  if (int > CART_MAX_QTY) return CART_MAX_QTY;
  return int;
}

/** Renvoie le `sellerSlug` du panier ou `null` si vide. */
export function getCurrentSellerSlug(state: CartState): string | null {
  return state.lines[0]?.sellerSlug ?? null;
}

/** Validation défensive d'une ligne lue depuis `localStorage`. */
export function isValidLine(line: unknown): line is CartLine {
  if (!line || typeof line !== "object") return false;
  const l = line as Partial<CartLine>;
  return (
    typeof l.productId === "string" && l.productId.length > 0 &&
    typeof l.productSlug === "string" && l.productSlug.length > 0 &&
    typeof l.sellerSlug === "string" && l.sellerSlug.length > 0 &&
    typeof l.name === "string" &&
    typeof l.vendor === "string" &&
    typeof l.icon === "string" &&
    typeof l.price === "number" && Number.isFinite(l.price) &&
    typeof l.currency === "string" &&
    typeof l.quantity === "number" && Number.isFinite(l.quantity)
  );
}

/**
 * Parse défensif d'une chaîne `localStorage` en `CartState`.
 * Renvoie toujours un état valide (jamais d'exception).
 * - JSON invalide -> panier vide.
 * - Lignes invalides filtrées.
 * - Si mélange de vendeurs détecté (corruption), garde le 1er vendeur.
 */
export function safeParseStored(raw: string | null): CartState {
  if (!raw) return EMPTY_CART;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_CART;
  }
  if (!parsed || typeof parsed !== "object") return EMPTY_CART;
  const rawLines = (parsed as { lines?: unknown }).lines;
  if (!Array.isArray(rawLines)) return EMPTY_CART;

  const lines = rawLines
    .filter(isValidLine)
    .map((l) => ({ ...l, quantity: clampQuantity(l.quantity) }))
    .slice(0, CART_MAX_LINES);

  if (lines.length === 0) return EMPTY_CART;

  // Sécurité mono-vendeur : ne conserve que les lignes du 1er vendeur.
  const firstSeller = lines[0].sellerSlug;
  return { lines: lines.filter((l) => l.sellerSlug === firstSeller) };
}
