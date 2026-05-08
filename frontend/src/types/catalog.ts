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
