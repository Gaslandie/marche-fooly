/**
 * Types: cart
 *
 * Rôle du fichier :
 *   Décrit les formes de données utilisées par le panier côté frontend :
 *     - `CartLine` : une ligne du panier (1 produit + quantité).
 *     - `CartState` : l'état complet du panier (liste de lignes).
 *     - `AddCartInput` : payload pour ajouter une ligne (quantité optionnelle).
 *     - `AddResult` : retour de `addItem()` — succès ou conflit explicite
 *       (mono-vendeur, limite atteinte).
 *
 * Où il est utilisé :
 *   - src/lib/cart.ts (utilitaires purs)
 *   - src/components/cart/CartProvider.tsx (Context React)
 *   - Plus tard : AddToCartButton, page panier, checkout.
 *
 * Règles métier / sécurité :
 *   - `productId` (ObjectId backend) est INDISPENSABLE pour POST /api/orders.
 *     Sans lui, on ne peut pas commander.
 *   - `sellerSlug` est utilisé pour la règle mono-vendeur (le backend
 *     refuse les paniers multi-vendeurs : on bloque côté UI au plus tôt).
 *   - `price` et `currency` sont AFFICHÉS uniquement. Le backend
 *     recalcule le total à la création de commande — on ne les envoie
 *     JAMAIS à /api/orders.
 *
 * Note pour GitHub Copilot :
 *   - Une ligne est unique par `productId` (et non par `slug`, qui n'est
 *     unique que par vendeur côté backend).
 */

import type { CurrencyCode } from "@/types/catalog";

/** Une ligne de panier (1 produit + quantité). */
export type CartLine = {
  productId: string;
  productSlug: string;
  sellerSlug: string;
  name: string;
  vendor: string;
  icon: string;
  price: number;
  currency: CurrencyCode;
  quantity: number;
};

/** État complet du panier. */
export type CartState = {
  lines: CartLine[];
};

/** Payload de `addItem()` — quantité optionnelle (défaut 1). */
export type AddCartInput = Omit<CartLine, "quantity"> & { quantity?: number };

/** Retour de `addItem()`. */
export type AddResult =
  | { ok: true }
  | {
      ok: false;
      reason: "seller-conflict";
      currentSeller: string;
      newSeller: string;
    }
  | { ok: false; reason: "max-lines" };
