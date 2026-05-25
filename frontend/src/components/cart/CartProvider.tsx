/**
 * Composant: CartProvider (Client Component)
 *
 * Rôle du fichier :
 *   Fournit l'état panier à toute l'application via React Context, avec
 *   persistance dans `localStorage` (clé `mf_cart_v1`). L'état réel vit
 *   dans un store de module au-dessus du composant, ce qui permet
 *   d'utiliser `useSyncExternalStore` (pattern canonique React 19 pour
 *   « s'abonner à une source de vérité externe » sans cascading renders
 *   ni mismatch SSR/CSR — la règle ESLint `react-hooks/set-state-in-effect`
 *   interdit l'ancien pattern useEffect+setState pour ce cas).
 *
 *   API exposée via le hook `useCart()` :
 *     - lines, sellerSlug, totalQuantity, subtotalDisplay (lecture)
 *     - addItem(input)       : mono-vendeur strict, renvoie un résultat
 *                              structuré en cas de conflit.
 *     - replaceCartWith(in)  : appelé après confirmation utilisateur
 *                              pour « vider et remplacer » en cas de
 *                              conflit vendeur.
 *     - removeItem(productId), updateQuantity(id, qty), clearCart().
 *
 * Où il est utilisé :
 *   - app/layout.tsx : enveloppe l'arbre (`<CartProvider>{children}`).
 *   - Plus tard : AddToCartButton, page panier, OrderSummary, checkout.
 *
 * Règles métier / sécurité :
 *   - `localStorage` est OK pour le panier (productId + quantity = aucune
 *     donnée secrète). DIFFÉRENT du JWT, qui reste en cookie httpOnly.
 *   - Mono-vendeur strict : tant qu'un panier contient un vendeur S1,
 *     toute tentative d'ajouter un produit du vendeur S2 renvoie
 *     `{ ok: false, reason: "seller-conflict" }`. L'appelant peut alors
 *     appeler `replaceCartWith()` après confirmation.
 *   - Bornes : quantité ∈ [1, 100], lignes ≤ 50 (alignés backend).
 *
 * Note pour GitHub Copilot :
 *   - `getServerSnapshot()` renvoie EMPTY_CART : sur SSR on rend toujours
 *     un panier vide ; l'hydratation depuis localStorage se fait au
 *     premier `getSnapshot()` côté client (lazy, idempotente).
 *   - Le state initial côté serveur ET côté client correspond (panier
 *     vide), évitant tout warning d'hydratation. Le re-render avec les
 *     vraies lignes survient juste après le montage.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { AddCartInput, AddResult, CartLine, CartState } from "@/types/cart";
import {
  CART_MAX_LINES,
  CART_STORAGE_KEY,
  EMPTY_CART,
  clampQuantity,
  getCurrentSellerSlug,
  safeParseStored,
} from "@/lib/cart";

/* ──────────────────────────────────────────────────────────────────
 * Store de module (source de vérité hors React)
 * ──────────────────────────────────────────────────────────────── */

let cartState: CartState = EMPTY_CART;
/** Référence stable pour le snapshot serveur (évite les warnings React). */
const SERVER_SNAPSHOT: CartState = EMPTY_CART;
const listeners = new Set<() => void>();
let hydrated = false;

function notify(): void {
  for (const listener of listeners) listener();
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
  } catch {
    // localStorage saturé / désactivé : on continue silencieusement.
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** Snapshot client : hydrate depuis localStorage à la 1re lecture. */
function getSnapshot(): CartState {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    cartState = safeParseStored(raw);
  }
  return cartState;
}

/** Snapshot serveur : toujours panier vide (référence stable). */
function getServerSnapshot(): CartState {
  return SERVER_SNAPSHOT;
}

function commit(next: CartState): void {
  if (next === cartState) return;
  cartState = next;
  persist();
  notify();
}

function buildLine(input: AddCartInput, quantity: number): CartLine {
  return {
    productId: input.productId,
    productSlug: input.productSlug,
    sellerSlug: input.sellerSlug,
    name: input.name,
    vendor: input.vendor,
    icon: input.icon,
    price: input.price,
    currency: input.currency,
    quantity,
  };
}

/* ──────────────────────────────────────────────────────────────────
 * Mutations (synchrones, sans setState React)
 * ──────────────────────────────────────────────────────────────── */

function addItemStore(input: AddCartInput): AddResult {
  // S'assurer que l'hydratation a eu lieu avant toute lecture.
  getSnapshot();
  const qty = clampQuantity(input.quantity ?? 1);
  const current = getCurrentSellerSlug(cartState);

  if (current && current !== input.sellerSlug) {
    return {
      ok: false,
      reason: "seller-conflict",
      currentSeller: current,
      newSeller: input.sellerSlug,
    };
  }

  const existingIndex = cartState.lines.findIndex(
    (l) => l.productId === input.productId,
  );

  if (existingIndex !== -1) {
    const existing = cartState.lines[existingIndex];
    const nextLines = [...cartState.lines];
    nextLines[existingIndex] = {
      ...existing,
      quantity: clampQuantity(existing.quantity + qty),
    };
    commit({ lines: nextLines });
    return { ok: true };
  }

  if (cartState.lines.length >= CART_MAX_LINES) {
    return { ok: false, reason: "max-lines" };
  }

  commit({ lines: [...cartState.lines, buildLine(input, qty)] });
  return { ok: true };
}

function replaceCartWithStore(input: AddCartInput): void {
  getSnapshot();
  const qty = clampQuantity(input.quantity ?? 1);
  commit({ lines: [buildLine(input, qty)] });
}

function removeItemStore(productId: string): void {
  getSnapshot();
  commit({ lines: cartState.lines.filter((l) => l.productId !== productId) });
}

function updateQuantityStore(productId: string, quantity: number): void {
  getSnapshot();
  if (quantity < 1) {
    commit({ lines: cartState.lines.filter((l) => l.productId !== productId) });
    return;
  }
  const q = clampQuantity(quantity);
  commit({
    lines: cartState.lines.map((l) =>
      l.productId === productId ? { ...l, quantity: q } : l,
    ),
  });
}

function clearCartStore(): void {
  commit(EMPTY_CART);
}

/* ──────────────────────────────────────────────────────────────────
 * Context React + hook public
 * ──────────────────────────────────────────────────────────────── */

type CartContextValue = {
  lines: CartLine[];
  /** Vendeur courant (null si panier vide). */
  sellerSlug: string | null;
  /** Somme des quantités. */
  totalQuantity: number;
  /** Sous-total d'AFFICHAGE (NE PAS envoyer au backend — recalcul serveur). */
  subtotalDisplay: number;
  addItem(input: AddCartInput): AddResult;
  replaceCartWith(input: AddCartInput): void;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  clearCart(): void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Hook public — lance une erreur si utilisé hors du Provider. */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart doit être utilisé à l'intérieur de <CartProvider/>");
  }
  return ctx;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((input: AddCartInput) => addItemStore(input), []);
  const replaceCartWith = useCallback(
    (input: AddCartInput) => replaceCartWithStore(input),
    [],
  );
  const removeItem = useCallback(
    (productId: string) => removeItemStore(productId),
    [],
  );
  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      updateQuantityStore(productId, quantity),
    [],
  );
  const clearCart = useCallback(() => clearCartStore(), []);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = state.lines.reduce((s, l) => s + l.quantity, 0);
    const subtotalDisplay = state.lines.reduce(
      (s, l) => s + l.price * l.quantity,
      0,
    );
    return {
      lines: state.lines,
      sellerSlug: getCurrentSellerSlug(state),
      totalQuantity,
      subtotalDisplay,
      addItem,
      replaceCartWith,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [state, addItem, replaceCartWith, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
