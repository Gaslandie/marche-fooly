/**
 * Lib: seller (MODULE SERVEUR UNIQUEMENT)
 *
 * Rôle du fichier :
 *   Helpers serveur de l'espace vendeur + sanitisation des produits :
 *     - `getMySellerProfile()`  : GET /api/sellers/me (profil + status).
 *     - `getSellerProducts(slug)`: GET /api/products?seller=<slug>.
 *     - `getSellerOrders()`     : GET /api/orders/seller.
 *     - `sanitizeSellerProductInput()` : whitelist stricte des champs
 *       produit avant transmission au backend (anti mass-assignment).
 *
 * Où il est utilisé :
 *   - app/vendeur/* (Server Components — bloc suivant).
 *   - app/api/seller/products/* (Route Handlers — mutations).
 *
 * Règles de sécurité (IMPORTANT) :
 *   - SERVEUR UNIQUEMENT (importe `lib/auth` -> `next/headers`) : exclu
 *     du bundle navigateur. Le JWT n'est jamais exposé ni journalisé.
 *   - `role === "seller"` NE SUFFIT JAMAIS : toujours revalider
 *     `sellerProfile.status` (approved/pending/rejected/suspended) côté
 *     serveur avant d'autoriser une action. Le backend reste la source
 *     de vérité (ownership + statut).
 *   - `sanitizeSellerProductInput` n'autorise QUE les champs MVP et force
 *     `currency = "GNF"`. Les champs internes (seller, slug, isFeatured,
 *     id, timestamps, version, rating...) ne sont jamais recopiés, donc
 *     jamais transmis — même si le client tente de les injecter.
 *
 * Note pour GitHub Copilot :
 *   - Les fonctions de fetch renvoient `null`/`[]` en cas d'échec
 *     (token absent, 404, panne) : l'appelant gère l'état.
 *   - `?seller=` ne renvoie que les statuts publics (active/out_of_stock) :
 *     les draft/archived n'apparaissent pas (limite MVP assumée).
 */

import { backendJson, readAuthToken } from "@/lib/auth";
import { resolveApiMediaUrl } from "@/lib/api";
import type { OrderPagination, PublicOrder } from "@/lib/orders";
import type { ApiProduct } from "@/types/api";

/* ──────────────────────────────────────────────────────────────────
 * Profil vendeur
 * ──────────────────────────────────────────────────────────────── */

export type SellerProfileStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export type SellerAddress = {
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
};

export type SellerProfile = {
  id: string;
  user: string;
  storeName: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  contactDetails: { email: string; phone: string };
  address: SellerAddress;
  status: SellerProfileStatus;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  approvedAt: string | null;
};

/**
 * Récupère le profil vendeur du compte connecté.
 * @returns le profil, ou `null` si pas de profil (404) / non connecté / panne.
 */
export async function getMySellerProfile(): Promise<SellerProfile | null> {
  const token = await readAuthToken();
  if (!token) return null;
  try {
    const result = await backendJson("/api/sellers/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return null; // 404 = aucun profil vendeur -> null
    const body = result.body as {
      data?: { sellerProfile?: SellerProfile };
    } | null;
    return body?.data?.sellerProfile ?? null;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────
 * Produits du vendeur (route publique filtrée par slug)
 * ──────────────────────────────────────────────────────────────── */

/**
 * Récupère les produits PUBLICS d'un vendeur (active/out_of_stock).
 * Route publique : aucun token requis. Les draft/archived ne remontent
 * pas (limite MVP).
 * @returns tableau (vide en cas d'échec).
 */
export async function getSellerProducts(
  sellerSlug: string,
): Promise<ApiProduct[]> {
  try {
    const result = await backendJson(
      `/api/products?seller=${encodeURIComponent(sellerSlug)}&limit=100`,
      { method: "GET" },
    );
    if (!result.ok) return [];
    const body = result.body as { data?: { items?: ApiProduct[] } } | null;
    return (body?.data?.items ?? []).map((product) => ({
      ...product,
      coverImageUrl: resolveApiMediaUrl(product.coverImageUrl),
      coverImage: product.coverImage
        ? {
            ...product.coverImage,
            largeUrl: resolveApiMediaUrl(product.coverImage.largeUrl),
            thumbUrl: resolveApiMediaUrl(product.coverImage.thumbUrl),
          }
        : product.coverImage,
      images: (product.images || []).map((image) => ({
        ...image,
        url: resolveApiMediaUrl(image.url),
        thumbUrl: resolveApiMediaUrl(image.thumbUrl || image.url),
      })),
    }));
  } catch {
    return [];
  }
}

/* ──────────────────────────────────────────────────────────────────
 * Commandes reçues par le vendeur
 * ──────────────────────────────────────────────────────────────── */

export type SellerOrdersResult = {
  items: PublicOrder[];
  pagination: OrderPagination;
};

/**
 * Récupère les commandes reçues par le vendeur connecté (approved).
 * @returns { items, pagination } ou `null` (token absent, 403, panne...).
 */
export async function getSellerOrders(): Promise<SellerOrdersResult | null> {
  const token = await readAuthToken();
  if (!token) return null;
  try {
    const result = await backendJson("/api/orders/seller?limit=100", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return null;
    const body = result.body as { data?: SellerOrdersResult } | null;
    if (!body?.data || !Array.isArray(body.data.items)) return null;
    return body.data;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────
 * Sanitisation des champs produit (anti mass-assignment)
 * ──────────────────────────────────────────────────────────────── */

/** Champs produit autorisés à la création/modification (MVP Jour 25). */
export const SELLER_PRODUCT_ALLOWED_FIELDS = [
  "name",
  "shortDescription",
  "description",
  "price",
  "stockQuantity",
  "sku",
  "images",
  "coverImage",
  "deliveryFee",
  "isFreeDelivery",
  "status",
  "category",
  "tags",
  "pickupAddress",
] as const;

/** Statuts produit autorisés côté frontend au MVP. */
const MVP_PRODUCT_STATUSES = ["active", "out_of_stock"];

/**
 * Construit un payload produit propre à partir d'un corps brut client :
 *   - whitelist stricte (les champs interdits ne sont jamais recopiés) ;
 *   - `currency` forcée à "GNF" ;
 *   - `status` borné aux statuts MVP (sinon ignoré) ; défaut "active" à
 *     la création.
 * PURE : aucune I/O.
 */
export function sanitizeSellerProductInput(
  raw: unknown,
  opts: { isCreate: boolean },
): Record<string, unknown> {
  const input =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const payload: Record<string, unknown> = {};
  for (const field of SELLER_PRODUCT_ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      payload[field] = input[field];
    }
  }

  // Devise toujours forcée côté serveur.
  payload.currency = "GNF";

  // Statut borné au MVP.
  if ("status" in payload && !MVP_PRODUCT_STATUSES.includes(String(payload.status))) {
    delete payload.status;
  }
  if (opts.isCreate && !("status" in payload)) {
    payload.status = "active";
  }

  return payload;
}
