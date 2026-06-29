/**
 * Lib: api
 *
 * Rôle du fichier :
 *   Client API centralisé du frontend. Regroupe :
 *     1. la lecture de l'URL de base (NEXT_PUBLIC_API_URL) ;
 *     2. un helper `request()` qui fait le fetch + gère les erreurs ;
 *     3. les fonctions publiques (getProducts, getProductBySlug,
 *        getCategories) consommées par les pages ;
 *     4. les « mappers » qui convertissent les réponses API
 *        (src/types/api.ts) vers les types métier du frontend
 *        (src/types/catalog.ts), sans toucher aux composants existants.
 *
 * Où il est utilisé :
 *   - Bloc 3+ : app/boutique, app/categories, app/produit/[slug]
 *     (ces pages ne sont PAS encore connectées au Bloc 2).
 *
 * Prérequis / infos utiles :
 *   - À appeler depuis des Server Components uniquement pour le Jour 21
 *     (fetch côté serveur, aucune clé exposée).
 *   - `fetch` n'est PAS mis en cache par défaut depuis Next.js 15+. On
 *     choisit ici explicitement `next: { revalidate: 60 }` (ISR doux) :
 *     le catalogue est rafraîchi au plus toutes les 60 s.
 *   - Toute fonction lève une `Error` lisible en cas d'échec : la page
 *     concernée la rattrapera via son fichier `error.tsx` (Bloc 3+).
 *
 * Notes pour GitHub Copilot / autocompletion :
 *   - Limites connues des mappers (champs absents de l'API) :
 *       icon (produit/catégorie) -> icône Bootstrap générique
 *       productCount (catégorie) -> compteur renvoyé par l'API
 *   - Détail produit : l'API expose /api/products/:sellerSlug/:productSlug
 *     (route composite). Le frontend n'a que /produit/[slug]. SOLUTION
 *     TEMPORAIRE validée (option B Jour 21) : on cherche le produit via
 *     la liste (?q=slug) puis match exact sur `slug`.
 *     LIMITE CONNUE : un slug produit n'est unique QUE par vendeur. Si
 *     deux vendeurs utilisent le même slug, le premier trouvé est
 *     retourné. La vraie solution future sera la route
 *     /produit/[sellerSlug]/[productSlug] (hors Jour 21).
 */

import type {
  ApiCategory,
  ApiListData,
  ApiProduct,
  ApiResponse,
} from "@/types/api";
import type { CategoryItem, CurrencyCode, ProductItem } from "@/types/catalog";

/* --- Configuration -------------------------------------------------------- */

/**
 * Renvoie l'URL de base de l'API, sans slash final.
 * Fallback développement : http://localhost:5000 (port du backend Express).
 */
function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  return raw.replace(/\/+$/, "");
}

/** Durée de revalidation du cache (secondes). */
const REVALIDATE_SECONDS = 60;

/* --- Helper de requête ---------------------------------------------------- */

/**
 * Effectue un GET sur l'API et renvoie le corps JSON typé.
 * @param path Chemin commençant par "/api/..." (ex: "/api/products").
 * @throws Error si la réponse réseau n'est pas OK ou si le JSON est invalide.
 */
async function request<TData>(path: string): Promise<ApiResponse<TData>> {
  const url = `${getApiBaseUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  } catch {
    throw new Error(
      "Impossible de joindre le serveur Marché Fooly. Vérifiez votre connexion.",
    );
  }

  if (!res.ok) {
    throw new Error(`Réponse API inattendue (${res.status}) pour ${path}.`);
  }

  return (await res.json()) as ApiResponse<TData>;
}

/** Construit une query string à partir d'un objet (ignore les valeurs vides). */
function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== null) {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/* --- Mappers : API -> types frontend -------------------------------------- */

/**
 * Normalise une devise libre en `CurrencyCode`.
 * Marché Fooly n'utilise que le franc guinéen : toute autre valeur est
 * ramenée à "GNF" (cf. AGENTS.md — prix uniformisés en GNF).
 */
function toCurrency(value: string): CurrencyCode {
  return value === "GNF" ? "GNF" : "GNF";
}

/** Extrait le slug d'une référence catégorie (objet peuplé ou string/null). */
function refCategorySlug(category: ApiProduct["category"]): string {
  if (category && typeof category === "object") return category.slug;
  return "";
}

/** Extrait le nom d'une référence catégorie (objet peuplé ou string/null). */
function refCategoryName(category: ApiProduct["category"]): string {
  if (category && typeof category === "object") return category.name;
  return "";
}

/** Extrait le nom du vendeur d'une référence (objet peuplé ou string/null). */
function refSellerName(seller: ApiProduct["seller"]): string {
  if (seller && typeof seller === "object") return seller.storeName;
  return "Vendeur Marché Fooly";
}

/** Extrait le slug du vendeur d'une référence (objet peuplé ou string/null). */
function refSellerSlug(seller: ApiProduct["seller"]): string {
  if (seller && typeof seller === "object") return seller.slug;
  return "";
}

/**
 * Convertit un produit API en `ProductItem` attendu par les composants.
 * Les champs absents de l'API reçoivent des placeholders neutres
 * (cf. commentaire d'en-tête « Limites connues »).
 */
export function toProductItem(api: ApiProduct): ProductItem {
  const inStock = api.stockQuantity > 0;

  return {
    slug: api.slug,
    name: api.name,
    shortDescription: api.shortDescription,
    description: api.description,
    vendor: refSellerName(api.seller),
    price: api.price,
    currency: toCurrency(api.currency),
    icon: "bi bi-box-seam",
    categorySlug: refCategorySlug(api.category),
    categoryName: refCategoryName(api.category),
    badge: api.isFeatured ? "Populaire" : undefined,
    stockLabel: inStock ? "En stock" : "Rupture de stock",
    stockQuantity: api.stockQuantity,
    inStock,
    sku: api.sku,
    coverImageUrl: api.coverImageUrl,
    deliveryFee: api.deliveryFee,
    isFreeDelivery: api.isFreeDelivery,
    pickupAddress: api.pickupAddress ?? null,
    // Identifiants utiles au panier / commande (Jour 23).
    productId: api.id,
    sellerSlug: refSellerSlug(api.seller),
  };
}

/**
 * Convertit une catégorie API en `CategoryItem` attendu par les composants.
 * `productCount` vient du backend et ne doit pas être inventé côté frontend.
 */
export function toCategoryItem(api: ApiCategory): CategoryItem {
  return {
    slug: api.slug,
    name: api.name,
    shortDescription: api.description,
    description: api.description,
    icon: "bi bi-grid-3x3-gap",
    productCount: api.productCount ?? 0,
    featured: false,
  };
}

/* --- Fonctions publiques -------------------------------------------------- */

/** Paramètres de filtre supportés par GET /api/products. */
export type GetProductsParams = {
  category?: string;
  q?: string;
  limit?: number;
};

/**
 * Récupère la liste publique des produits.
 * Filtres serveur disponibles : category (slug), q (recherche), limit.
 * Les autres filtres boutique (prix, stock, promo...) restent gérés
 * côté frontend (option A validée Jour 21).
 */
export async function getProducts(
  params: GetProductsParams = {},
): Promise<ProductItem[]> {
  const query = buildQuery({
    category: params.category,
    q: params.q,
    limit: params.limit ?? 100,
  });
  const body = await request<ApiListData<ApiProduct>>(`/api/products${query}`);
  return body.data.items.map(toProductItem);
}

/**
 * Récupère un produit par son seul slug (solution TEMPORAIRE — option B).
 * Recherche via la liste (?q=slug) puis match exact sur `slug`.
 * @returns Le produit, ou `null` si aucun produit ne correspond.
 */
export async function getProductBySlug(
  slug: string,
): Promise<ProductItem | null> {
  const candidates = await getProducts({ q: slug, limit: 100 });
  return candidates.find((product) => product.slug === slug) ?? null;
}

/** Récupère la liste publique des catégories actives (triées par sortOrder). */
export async function getCategories(): Promise<CategoryItem[]> {
  const body = await request<ApiListData<ApiCategory>>("/api/categories");
  return body.data.items.map(toCategoryItem);
}

/** Option de catégorie pour un <select> (conserve l'`id` ObjectId). */
export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Récupère les catégories sous forme d'options { id, name, slug }.
 * Contrairement à getCategories() (qui mappe vers CategoryItem et perd
 * l'id), on conserve ici l'`id` ObjectId — indispensable au formulaire
 * produit vendeur, car POST/PATCH /api/products attend `category` = ObjectId.
 */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const body = await request<ApiListData<ApiCategory>>("/api/categories");
  return body.data.items.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
}
