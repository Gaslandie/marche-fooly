import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import ProductSort from "@/components/product/ProductSort";
import { getCategories, getProducts } from "@/lib/api";
import { getSellerNavigationState } from "@/lib/sellerNavigation";
import styles from "@/styles/catalog.module.css";
import type { ProductItem, ProductSortKey, ProductViewMode } from "@/types/catalog";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Cette page dépend d'une API live (GET /api/products) : on force le rendu
// dynamique (à la requête). Le build Next.js ne contacte donc plus le backend.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "Découvrez les produits disponibles sur Marché Fooly : téléphones, électroménager, mode, maison, accessoires et bonnes affaires à Sangarédi.",
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSort(value?: string): ProductSortKey {
  const allowed: ProductSortKey[] = ["recommended", "price-asc", "price-desc"];
  return allowed.includes(value as ProductSortKey) ? (value as ProductSortKey) : "recommended";
}

function normalizeView(value?: string): ProductViewMode {
  return value === "list" ? "list" : "grid";
}

function getPriceLimits(products: ProductItem[]) {
  const prices = products
    .map((product) => product.price)
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

function filterProducts(
  products: ProductItem[],
  {
    maxPrice,
    stockOnly,
    sort,
  }: {
    maxPrice: number;
    stockOnly: boolean;
    sort: ProductSortKey;
  },
) {
  const filtered = products.filter((product) => {
    const matchesPrice = maxPrice > 0 ? product.price <= maxPrice : true;
    const matchesStock = stockOnly ? product.inStock : true;
    return matchesPrice && matchesStock;
  });

  return [...filtered].sort((left, right) => {
    if (sort === "price-asc") return left.price - right.price;
    if (sort === "price-desc") return right.price - left.price;
    return 0;
  });
}

export default async function BoutiquePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const category = readParam(params.category);
  const query = readParam(params.q)?.trim() ?? "";
  const stockOnly = readParam(params.stock) === "1";
  const sort = normalizeSort(readParam(params.sort));
  const view = normalizeView(readParam(params.view));

  // Produits réels : API backend (GET /api/products). Seuls les filtres
  // réellement supportés par l'API sont envoyés côté serveur.
  const [apiProducts, apiCategories, sellerNavigation] = await Promise.all([
    getProducts({ category, q: query, limit: 100 }),
    getCategories(),
    getSellerNavigationState(),
  ]);

  const priceLimits = getPriceLimits(apiProducts);
  const rawMaxPrice = Number(readParam(params.maxPrice));
  const maxPrice =
    priceLimits.max > 0 && Number.isFinite(rawMaxPrice)
      ? Math.min(Math.max(rawMaxPrice, priceLimits.min), priceLimits.max)
      : priceLimits.max;

  const filteredProducts = filterProducts(apiProducts, {
    maxPrice,
    stockOnly,
    sort,
  });

  const filterCategories = apiCategories;
  const totalPublicProducts = apiCategories.reduce(
    (total, item) => total + item.productCount,
    0,
  );
  const categoryLabel =
    apiCategories.find((item) => item.slug === category)?.name ??
    "";
  const summary = categoryLabel
    ? `Résultats pour ${categoryLabel}`
    : query
      ? `Résultats pour “${query}”`
      : "Résultats pour la boutique Marché Fooly";

  return (
    <>
      <section className={styles.heroSection}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className={`mb-3 ${styles.breadcrumbNav}`}>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>
                  Accueil
                </Link>
              </li>
              <li className={`breadcrumb-item active ${styles.breadcrumbCurrent}`} aria-current="page">
                Boutique
              </li>
            </ol>
          </nav>

          <div className="row align-items-end g-4">
            <div className="col-lg-7">
              <span className={styles.heroBadge}>
                <i className="bi bi-bag-check-fill" aria-hidden="true"></i>
                Produits disponibles à Sangarédi
              </span>
              <h1 className={`${styles.heroTitle} mb-3`}>Boutique Marché Fooly</h1>
              <p className={styles.heroText}>
                Explorez les meilleures offres locales : téléphones, électroménager, mode,
                maison, alimentation, accessoires et bonnes affaires près de chez vous.
              </p>
            </div>

            <div className="col-lg-5">
              <div className="row g-3">
                <div className="col-4">
                  <div className={styles.shopStatCard}>
                    <strong>{totalPublicProducts}</strong>
                    <span className="text-secondary small">Produits</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className={styles.shopStatCard}>
                    <strong>{apiCategories.length}</strong>
                    <span className="text-secondary small">Catégories</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className={styles.shopStatCard}>
                    <strong>Local</strong>
                    <span className="text-secondary small">Sangarédi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.dealStrip}>
            <div className="row align-items-center g-3 position-relative">
              <div className="col-lg-8">
                <span className="badge rounded-pill bg-warning text-dark mb-2">Catalogue local</span>
                <h2 className="h3 fw-bold mb-1">Découvrez les produits disponibles</h2>
                <p className={styles.bannerText}>
                  Parcourez les offres publiées par les vendeurs validés sur Marché Fooly.
                </p>
              </div>
              <div className="col-lg-4 text-lg-end">
                <Link href="/categories" className="btn btn-light fw-bold">
                  Explorer les catégories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.shopLayout}>
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3">
              <ProductFilters
                categories={filterCategories}
                totalProducts={totalPublicProducts}
                selectedCategory={category}
                query={query}
                maxPrice={maxPrice}
                maxPriceLimit={priceLimits.max}
                minPriceLimit={priceLimits.min}
                stockOnly={stockOnly}
                sort={sort}
                view={view}
                sellerStatus={sellerNavigation.sellerStatus}
                showSellerEntry={sellerNavigation.showSellerEntry}
              />
            </div>

            <div className="col-lg-9">
              <ProductSort total={filteredProducts.length} summary={summary} sort={sort} view={view} />

              <div className="row g-4 mt-1">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.slug}
                      className={view === "list" ? "col-12" : "col-sm-6 col-xl-4"}
                    >
                      <ProductCard product={product} view={view} />
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <div className={styles.emptyState}>
                      <h2>Aucun produit trouvé</h2>
                      <p>
                        Ajustez les filtres ou revenez à la boutique complète pour voir toutes les offres.
                      </p>
                      <Link href="/boutique" className="btn btn-outline-dark mt-3">
                        Réinitialiser la boutique
                      </Link>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

    </>
  );
}
