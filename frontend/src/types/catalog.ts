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
  shortDescription: string;
  description: string;
  vendor: string;
  price: number;
  currency: CurrencyCode;
  icon: string;
  categorySlug: string;
  categoryName: string;
  badge?: string;
  stockLabel: string;
  stockQuantity: number;
  inStock: boolean;
  sku: string;
  coverImageUrl: string;
  deliveryFee: number;
  isFreeDelivery: boolean;
  pickupAddress: {
    city: string;
    region: string;
    country: string;
  } | null;
  // Champs renseignés par les mappers API (toProductItem) :
  // - productId : ObjectId Mongo, requis pour POST /api/orders
  // - sellerSlug : utilisé pour la règle mono-vendeur côté panier
  productId: string;
  sellerSlug: string;
};

export type ProductSortKey = "recommended" | "price-asc" | "price-desc";
export type ProductViewMode = "grid" | "list";

export type ProductFilterParams = {
  category?: string;
  query?: string;
  maxPrice?: number;
  stockOnly?: boolean;
  sort?: ProductSortKey;
};
