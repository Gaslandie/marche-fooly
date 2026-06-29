/**
 * Types: api
 *
 * Rôle du fichier :
 *   Décrit la FORME EXACTE des réponses JSON renvoyées par le backend
 *   Express (`backend/src/controllers/*`). Ces types sont volontairement
 *   SÉPARÉS des types « métier » du frontend (`src/types/catalog.ts`).
 *
 *   Pourquoi séparer ?
 *     L'API ne renvoie pas les mêmes champs que ceux attendus par les
 *     composants actuels (ProductCard, CategoryCard...). On garde donc
 *     deux mondes : les types API ici, et des « mappers » dans
 *     `src/lib/api.ts` qui convertissent API -> types frontend. Les
 *     composants existants n'ont ainsi pas à changer.
 *
 * Où il est utilisé :
 *   - `src/lib/api.ts` : typage des réponses fetch avant mapping.
 *
 * Prérequis / infos utiles :
 *   - Source de vérité backend :
 *       toPublicProduct()  -> backend/src/controllers/productController.js
 *       toPublicCategory() -> backend/src/controllers/categoryController.js
 *   - Enveloppe commune des réponses : { success, message, data }.
 *   - `category` et `seller` d'un produit sont normalement « peuplés »
 *     (objet), mais le contrat backend autorise une string ObjectId ou
 *     null : on type donc une union défensive.
 */

/** Bloc de pagination renvoyé par les endpoints de liste. */
export type ApiPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Enveloppe générique d'une réponse API : { success, message, data }. */
export type ApiResponse<TData> = {
  success: boolean;
  message: string;
  data: TData;
};

/** Charge utile d'un endpoint de liste : items + pagination. */
export type ApiListData<TItem> = {
  items: TItem[];
  pagination: ApiPagination;
};

/* --- Catégories ----------------------------------------------------------- */

/** Une catégorie telle que renvoyée par GET /api/categories. */
export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentCategory: string | null;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/* --- Produits ------------------------------------------------------------- */

/** Une image de produit. */
export type ApiProductImage = {
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

/** Référence catégorie « peuplée » dans un produit (categoryShape backend). */
export type ApiCategoryRef = {
  id: string;
  slug: string;
  name: string;
};

/** Référence vendeur « peuplée » dans un produit (sellerShape backend). */
export type ApiSellerRef = {
  id: string;
  slug: string;
  storeName: string;
};

/** Adresse de retrait du produit. */
export type ApiPickupAddress = {
  city: string;
  region: string;
  country: string;
};

/** Un produit tel que renvoyé par GET /api/products (toPublicProduct). */
export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  currency: string;
  stockQuantity: number;
  sku: string;
  images: ApiProductImage[];
  coverImageUrl: string;
  status: string;
  tags: string[];
  deliveryFee: number;
  isFreeDelivery: boolean;
  pickupAddress: ApiPickupAddress;
  isFeatured: boolean;
  // Normalement peuplé (objet) ; le contrat autorise string ObjectId ou null.
  category: ApiCategoryRef | string | null;
  seller: ApiSellerRef | string | null;
  createdAt: string;
  updatedAt: string;
};
