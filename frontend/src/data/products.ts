import { categories } from "@/data/categories";
import type { ProductFilterParams, ProductItem } from "@/types/catalog";

export const products: ProductItem[] = [
  {
    slug: "samsung-a12",
    name: "Téléphone Samsung A12",
    vendor: "Boutique Diallo",
    price: 1200000,
    currency: "GNF",
    rating: 4.5,
    reviewCount: 24,
    icon: "bi bi-phone",
    categorySlug: "telephones-accessoires",
    badge: "Populaire",
    stockLabel: "En stock",
    inStock: true,
    isPromo: false,
    isLocal: true,
    sortRank: 1,
    newestRank: 7,
  },
  {
    slug: "routeur-wifi-rapide",
    name: "Routeur Wi-Fi rapide",
    vendor: "Tech Sangarédi",
    price: 350000,
    currency: "GNF",
    rating: 4,
    reviewCount: 18,
    icon: "bi bi-router",
    categorySlug: "telephones-accessoires",
    badge: "Promo",
    stockLabel: "En stock",
    inStock: true,
    isPromo: true,
    isLocal: true,
    sortRank: 2,
    newestRank: 6,
  },
  {
    slug: "machine-a-laver-familiale",
    name: "Machine à laver familiale",
    vendor: "Maison Plus",
    price: 3200000,
    currency: "GNF",
    rating: 3.5,
    reviewCount: 11,
    icon: "bi bi-moisture",
    categorySlug: "electromenagers",
    stockLabel: "En stock",
    inStock: true,
    isPromo: false,
    isLocal: false,
    sortRank: 3,
    newestRank: 3,
  },
  {
    slug: "huile-de-soin-naturelle",
    name: "Huile de soin naturelle",
    vendor: "Beauté Locale",
    price: 120000,
    currency: "GNF",
    rating: 5,
    reviewCount: 32,
    icon: "bi bi-droplet-half",
    categorySlug: "sacs-bijoux",
    badge: "Nouveau",
    stockLabel: "En stock",
    inStock: true,
    isPromo: false,
    isLocal: true,
    sortRank: 4,
    newestRank: 9,
  },
  {
    slug: "location-maison-sangaredi",
    name: "Location maison à Sangarédi",
    vendor: "Immo Fooly",
    price: 12000000,
    currency: "GNF",
    rating: 4,
    reviewCount: 9,
    icon: "bi bi-house-door",
    categorySlug: "maison-cuisine",
    stockLabel: "Disponible",
    inStock: true,
    isPromo: false,
    isLocal: true,
    sortRank: 5,
    newestRank: 2,
  },
  {
    slug: "iphone-12-occasion",
    name: "iPhone 12 occasion propre",
    vendor: "Mobile Center",
    price: 4800000,
    currency: "GNF",
    rating: 4.5,
    reviewCount: 41,
    icon: "bi bi-phone-fill",
    categorySlug: "telephones-accessoires",
    badge: "Top",
    stockLabel: "En stock",
    inStock: true,
    isPromo: true,
    isLocal: false,
    sortRank: 6,
    newestRank: 5,
  },
  {
    slug: "television-ecran-plat",
    name: "Télévision écran plat",
    vendor: "Electro Fooly",
    price: 2500000,
    currency: "GNF",
    rating: 3.5,
    reviewCount: 14,
    icon: "bi bi-display",
    categorySlug: "electromenagers",
    stockLabel: "En stock",
    inStock: true,
    isPromo: false,
    isLocal: true,
    sortRank: 7,
    newestRank: 4,
  },
  {
    slug: "sac-tendance-femme",
    name: "Sac tendance femme",
    vendor: "Style Kadé",
    price: 85000,
    currency: "GNF",
    rating: 4,
    reviewCount: 21,
    icon: "bi bi-bag-heart",
    categorySlug: "sacs-bijoux",
    badge: "Local",
    stockLabel: "En stock",
    inStock: true,
    isPromo: false,
    isLocal: true,
    sortRank: 8,
    newestRank: 8,
  },
  {
    slug: "pack-alimentation-maison",
    name: "Pack alimentation maison",
    vendor: "Marché Local",
    price: 150000,
    currency: "GNF",
    rating: 4,
    reviewCount: 16,
    icon: "bi bi-basket2",
    categorySlug: "alimentation",
    badge: "Nouveau",
    stockLabel: "En stock",
    inStock: true,
    isPromo: false,
    isLocal: true,
    sortRank: 9,
    newestRank: 10,
  },
];

export const maxCatalogPrice = 12000000;
export const minCatalogPrice = 5000;
export const shopCategoryFilters = [
  "alimentation",
  "telephones-accessoires",
  "electromenagers",
  "maison-cuisine",
  "vetements-femme",
  "vetements-homme",
  "automobile",
  "bebe-maternite",
];

// `source` permet de filtrer une liste fournie par l'appelant (ex : produits
// renvoyés par l'API). Par défaut, on retombe sur le tableau statique local
// pour rester rétrocompatible avec les anciens appels.
export function getFilteredProducts(
  {
    category,
    query,
    maxPrice = maxCatalogPrice,
    stockOnly,
    promoOnly,
    localOnly,
    minRating,
    sort = "recommended",
  }: ProductFilterParams,
  source: ProductItem[] = products,
) {
  const normalizedQuery = query?.trim().toLowerCase() ?? "";

  const filtered = source.filter((product) => {
    const matchesCategory = category ? product.categorySlug === category : true;
    const matchesQuery = normalizedQuery
      ? [product.name, product.vendor, product.slug]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      : true;
    const matchesPrice = product.price <= maxPrice;
    const matchesStock = stockOnly ? product.inStock : true;
    const matchesPromo = promoOnly ? product.isPromo : true;
    const matchesLocal = localOnly ? product.isLocal : true;
    const matchesRating = minRating ? product.rating >= minRating : true;

    return (
      matchesCategory &&
      matchesQuery &&
      matchesPrice &&
      matchesStock &&
      matchesPromo &&
      matchesLocal &&
      matchesRating
    );
  });

  const sorted = [...filtered].sort((left, right) => {
    switch (sort) {
      case "price-asc":
        return left.price - right.price;
      case "price-desc":
        return right.price - left.price;
      case "rating":
        return right.rating - left.rating || right.reviewCount - left.reviewCount;
      case "newest":
        return right.newestRank - left.newestRank;
      case "recommended":
      default:
        return left.sortRank - right.sortRank;
    }
  });

  return sorted;
}

export function getCategoryLabel(slug?: string) {
  return categories.find((category) => category.slug === slug)?.name;
}
