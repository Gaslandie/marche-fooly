export type CurrencyCode = "GNF";

export type CategoryItem = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  icon: string;
  productCount: number;
  featured?: boolean;
};

export type ProductItem = {
  slug: string;
  name: string;
  vendor: string;
  price: number;
  currency: CurrencyCode;
  rating: number;
  reviewCount: number;
  icon: string;
  categorySlug: string;
  badge?: string;
  stockLabel: string;
  inStock: boolean;
  isPromo: boolean;
  isLocal: boolean;
  sortRank: number;
  newestRank: number;
  // Champs renseignés par les mappers API (toProductItem) :
  // - productId : ObjectId Mongo, requis pour POST /api/orders
  // - sellerSlug : utilisé pour la règle mono-vendeur côté panier
  // Optionnels pour rester rétrocompatibles avec les produits statiques
  // de src/data/products.ts (fallback dev qui ne fournit pas ces champs).
  productId?: string;
  sellerSlug?: string;
};

export type ProductSortKey = "recommended" | "price-asc" | "price-desc" | "rating" | "newest";
export type ProductViewMode = "grid" | "list";

export type ProductFilterParams = {
  category?: string;
  query?: string;
  maxPrice?: number;
  stockOnly?: boolean;
  promoOnly?: boolean;
  localOnly?: boolean;
  minRating?: number;
  sort?: ProductSortKey;
};
