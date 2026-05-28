/**
 * Lib: orders (MODULE SERVEUR UNIQUEMENT)
 *
 * Rôle du fichier :
 *   Helpers serveur + utilitaires d'affichage pour les commandes :
 *     - `PublicOrder` : forme exacte renvoyée par le backend
 *       (backend/src/controllers/orderController.js -> toPublicOrder).
 *     - `getOrderByReference(reference)` : GET /api/orders/:ref.
 *     - `getMyOrders(params)` : GET /api/orders/mine (commandes du
 *       client connecté, filtre status optionnel + pagination).
 *   Les deux fonctions de fetch authentifient via le cookie httpOnly et
 *   renvoient `null` pour tout échec (token absent, 401, 403, 404, panne).
 *
 *   Les helpers d'AFFICHAGE des statuts (libellés FR, classes Bootstrap,
 *   `buildOrderTimeline`) sont PURS et vivent dans `lib/orderStatus.ts`
 *   (importables côté client, contrairement à ce module serveur).
 *
 * Où il est utilisé :
 *   - app/commande/[reference]/page.tsx (confirmation).
 *   - app/commandes (historique client — branché au bloc suivant).
 *   - Réutilisable par un futur espace vendeur/admin (mêmes statuts).
 *
 * Règles de sécurité :
 *   - Les fonctions de FETCH sont SERVEUR UNIQUEMENT (importent
 *     `next/headers` via lib/auth) : exclues du bundle navigateur.
 *   - Le JWT n'est jamais journalisé.
 *   - En cas d'absence/échec, on renvoie null : l'appelant décide
 *     (notFound, état d'erreur...). On ne révèle pas l'existence d'une
 *     ressource non autorisée (alignement backend 404 vs 403).
 *
 * Note pour GitHub Copilot :
 *   - `PublicOrder` est miroir de toPublicOrder() côté backend.
 *   - `seller` peut être un objet peuplé (id/slug/storeName) OU une
 *     string ObjectId selon le contexte backend (cf. serializeSellerRef).
 *   - Les 6 statuts backend : pending, confirmed, preparing, shipped,
 *     delivered, cancelled.
 */

import { backendJson, readAuthToken } from "@/lib/auth";

export type OrderAddress = {
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
};

export type OrderItem = {
  product: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type OrderSellerRef =
  | { id: string; slug: string; storeName: string }
  | string
  | null;

export type PublicOrder = {
  id: string;
  reference: string;
  customer: string | null;
  seller: OrderSellerRef;
  status: string;
  paymentMethod: string;
  fulfillmentMethod: string;
  currency: string;
  items: OrderItem[];
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  shippingAddress: OrderAddress;
  customerPhone: string;
  notes: string;
  placedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Récupère une commande par sa référence (ORD-YYYYMMDD-XXXXX).
 * @returns la commande si l'utilisateur est autorisé, sinon `null`.
 *          Ne lève jamais : 401/403/404/réseau -> null.
 */
export async function getOrderByReference(
  reference: string,
): Promise<PublicOrder | null> {
  const token = await readAuthToken();
  if (!token) return null;

  try {
    const result = await backendJson(
      `/api/orders/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!result.ok) return null;
    const body = result.body as { data?: { order?: PublicOrder } } | null;
    return body?.data?.order ?? null;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────
 * Liste des commandes du client connecté (GET /api/orders/mine)
 * ──────────────────────────────────────────────────────────────── */

export type OrderPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type MyOrdersResult = {
  items: PublicOrder[];
  pagination: OrderPagination;
};

export type GetMyOrdersParams = {
  status?: string;
  page?: number;
  limit?: number;
};

/**
 * Récupère les commandes du client connecté.
 * Le backend filtre strictement sur customer === utilisateur du JWT :
 * on ne voit donc QUE ses propres commandes.
 * @returns { items, pagination } ou `null` (token absent, 401, panne...).
 */
export async function getMyOrders(
  params: GetMyOrdersParams = {},
): Promise<MyOrdersResult | null> {
  const token = await readAuthToken();
  if (!token) return null;

  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 50));

  try {
    const result = await backendJson(`/api/orders/mine?${search.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return null;
    const body = result.body as { data?: MyOrdersResult } | null;
    if (!body?.data || !Array.isArray(body.data.items)) return null;
    return body.data;
  } catch {
    return null;
  }
}

// Les helpers d'affichage des statuts (libellés, classes, timeline) sont
// PURS et vivent dans `lib/orderStatus.ts` pour être importables côté
// client sans tirer ce module serveur (next/headers) dans le bundle.
