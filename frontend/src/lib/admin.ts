/**
 * Lib: admin (MODULE SERVEUR UNIQUEMENT)
 *
 * Rôle du fichier :
 *   Fetchers serveur de supervision back office (lecture) :
 *     - getAdminUsers(params)
 *     - getAdminSellers(params)
 *     - getAdminProducts(params)
 *     - getAdminOrders(params)
 *   Chacun appelle le backend /api/admin/* avec le JWT lu dans le cookie
 *   httpOnly et renvoie `{ items, pagination }` ou `null` (échec).
 *
 * Où il est utilisé :
 *   - app/admin/* (Server Components — pages protégées).
 *
 * Règles de sécurité (IMPORTANT) :
 *   - SERVEUR UNIQUEMENT (importe lib/auth -> next/headers) : exclu du
 *     bundle navigateur. JWT jamais exposé ni journalisé.
 *   - Le backend impose les rôles back office : un utilisateur non autorisé
 *     reçoit 403 -> ici on renvoie `null`.
 *   - Les types reflètent les whitelists backend (toAdminUser/Seller/...):
 *     jamais de `passwordHash` ni de secret.
 *
 * Note pour GitHub Copilot :
 *   - Pour des compteurs (stats), appeler avec `{ limit: 1 }` et lire
 *     `pagination.total` (évite de tout charger).
 */

import { redirect } from "next/navigation";
import { backendJson, getCurrentUser, readAuthToken } from "@/lib/auth";
import type { AuthRole, AuthUser } from "@/types/auth";

export const BACKOFFICE_ROLES: AuthRole[] = ["owner", "admin", "staff"];
export const ADMIN_OPERATION_ROLES: AuthRole[] = ["owner", "admin"];

export function hasBackOfficeAccess(role: AuthRole) {
  return BACKOFFICE_ROLES.includes(role);
}

export function canManageOperations(role: AuthRole) {
  return ADMIN_OPERATION_ROLES.includes(role);
}

export function canManageTeam(role: AuthRole) {
  return role === "owner";
}

/**
 * Garde back office pour les pages /admin/* (Server Components).
 * - non connecté          -> redirect("/mon-compte")
 * - rôle non autorisé     -> redirect("/")
 * Le backend impose AUSSI les rôles côté API (défense en profondeur).
 * À appeler en tout début de page (redirect() lève une exception).
 */
export async function requireBackOffice(
  allowedRoles: AuthRole[] = BACKOFFICE_ROLES,
): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/mon-compte");
  if (!allowedRoles.includes(user.role)) redirect("/");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireBackOffice(ADMIN_OPERATION_ROLES);
}

export type AdminPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminListResult<T> = {
  items: T[];
  pagination: AdminPagination;
};

export type GetAdminListParams = {
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminUserRef =
  | { id: string; firstName: string; lastName: string; email: string }
  | { id: string }
  | null;

export type AdminSeller = {
  id: string;
  storeName: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  approvedAt: string | null;
  createdAt: string;
  user: AdminUserRef;
};

export type AdminRef = { id: string; name?: string; slug?: string; storeName?: string } | string | null;

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  stockQuantity: number;
  status: string;
  isFeatured: boolean;
  category: AdminRef;
  seller: AdminRef;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  fulfillmentMethod: string;
  customer: string | null;
  seller: AdminRef;
  placedAt: string;
  createdAt: string;
};

/** Appel générique d'une liste admin (GET, authentifié). */
async function adminList<T>(
  path: string,
  params: GetAdminListParams,
): Promise<AdminListResult<T> | null> {
  const token = await readAuthToken();
  if (!token) return null;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();

  try {
    const result = await backendJson(`${path}${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return null;
    const body = result.body as { data?: AdminListResult<T> } | null;
    if (!body?.data || !Array.isArray(body.data.items)) return null;
    return body.data;
  } catch {
    return null;
  }
}

export function getAdminUsers(params: GetAdminListParams = {}) {
  return adminList<AdminUser>("/api/admin/users", params);
}

export function getAdminSellers(params: GetAdminListParams = {}) {
  return adminList<AdminSeller>("/api/admin/sellers", params);
}

export function getAdminProducts(params: GetAdminListParams = {}) {
  return adminList<AdminProduct>("/api/admin/products", params);
}

export function getAdminOrders(params: GetAdminListParams = {}) {
  return adminList<AdminOrder>("/api/admin/orders", params);
}
