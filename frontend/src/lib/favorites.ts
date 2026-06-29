/**
 * Lib: favorites (MODULE SERVEUR UNIQUEMENT)
 *
 * Les favoris sont lus avec le JWT du cookie httpOnly et restent donc
 * strictement lies au compte connecte.
 */

import { backendJson, readAuthToken } from "@/lib/auth";
import { toProductItem } from "@/lib/api";
import type { ApiFavorite, ApiListData } from "@/types/api";
import type { ProductItem } from "@/types/catalog";

export type FavoriteItem = {
  id: string;
  product: ProductItem;
  createdAt: string;
  updatedAt: string;
};

export type FavoritePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type MyFavoritesResult = {
  items: FavoriteItem[];
  pagination: FavoritePagination;
};

export type GetMyFavoritesParams = {
  page?: number;
  limit?: number;
};

function mapFavorite(api: ApiFavorite): FavoriteItem {
  return {
    id: api.id,
    product: toProductItem(api.product),
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

export async function getMyFavorites(
  params: GetMyFavoritesParams = {},
): Promise<MyFavoritesResult | null> {
  const token = await readAuthToken();
  if (!token) return null;

  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 50));

  try {
    const result = await backendJson(`/api/favorites?${search.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return null;
    const body = result.body as { data?: ApiListData<ApiFavorite> } | null;
    if (!body?.data || !Array.isArray(body.data.items)) return null;
    return {
      items: body.data.items.map(mapFavorite),
      pagination: body.data.pagination,
    };
  } catch {
    return null;
  }
}

export async function getMyFavoriteCount(): Promise<number> {
  const result = await getMyFavorites({ limit: 1 });
  return result?.pagination.total ?? 0;
}
