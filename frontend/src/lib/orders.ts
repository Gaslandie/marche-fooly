/**
 * Lib: orders (MODULE SERVEUR UNIQUEMENT)
 *
 * Rôle du fichier :
 *   Helpers serveur pour les commandes :
 *     - `PublicOrder` : forme exacte renvoyée par le backend
 *       (backend/src/controllers/orderController.js -> toPublicOrder).
 *     - `getOrderByReference(reference)` : appelle GET /api/orders/:ref
 *       en authentifiant via le cookie httpOnly. Renvoie `null` pour
 *       tout échec (token absent, 401, 404, panne réseau).
 *
 * Où il est utilisé :
 *   - app/commande/[reference]/page.tsx (page de confirmation Server).
 *
 * Règles de sécurité :
 *   - Module SERVEUR UNIQUEMENT (importe `next/headers` via lib/auth) :
 *     ne sera pas inclus dans le bundle navigateur.
 *   - Le JWT n'est jamais journalisé.
 *   - En cas d'absence/échec, on renvoie null : la page utilisera
 *     `notFound()` pour ne PAS révéler l'existence d'une commande
 *     (alignement avec la stratégie backend 404 vs 403).
 *
 * Note pour GitHub Copilot :
 *   - La forme `PublicOrder` est miroir de toPublicOrder() côté backend.
 *   - `seller` peut être un objet peuplé (id/slug/storeName) OU une
 *     string ObjectId selon le contexte backend (cf. serializeSellerRef).
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
