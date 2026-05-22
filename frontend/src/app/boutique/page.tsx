import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import ProductSort from "@/components/product/ProductSort";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { categories } from "@/data/categories";
import {
  getCategoryLabel,
  getFilteredProducts,
  maxCatalogPrice,
  minCatalogPrice,
  shopCategoryFilters,
} from "@/data/products";
import { getProducts } from "@/lib/api";
import styles from "@/styles/catalog.module.css";
import type { ProductSortKey, ProductViewMode } from "@/types/catalog";

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
  const allowed: ProductSortKey[] = ["recommended", "price-asc", "price-desc", "rating", "newest"];
  return allowed.includes(value as ProductSortKey) ? (value as ProductSortKey) : "recommended";
}

function normalizeView(value?: string): ProductViewMode {
  return value === "list" ? "list" : "grid";
}

export default async function BoutiquePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const category = readParam(params.category);
  const query = readParam(params.q)?.trim() ?? "";
  const rawMaxPrice = Number(readParam(params.maxPrice) ?? maxCatalogPrice);
  const maxPrice = Number.isFinite(rawMaxPrice)
    ? Math.min(Math.max(rawMaxPrice, minCatalogPrice), maxCatalogPrice)
    : maxCatalogPrice;
  const stockOnly = readParam(params.stock) === "1";
  const promoOnly = readParam(params.promo) === "1";
  const localOnly = readParam(params.local) === "1";
  const rawRating = Number(readParam(params.rating));
  const minRating = rawRating === 4 || rawRating === 3 ? rawRating : undefined;
  const sort = normalizeSort(readParam(params.sort));
  const view = normalizeView(readParam(params.view));

  // Produits réels : API backend (GET /api/products). Seuls les query params
  // supportés par l'API (category, q, limit) sont envoyés côté serveur. Les
  // autres filtres (prix, stock, promo, local, note) et le tri restent
  // appliqués côté frontend par getFilteredProducts (décision Jour 21).
  const apiProducts = await getProducts({ category, q: query, limit: 100 });

  const filteredProducts = getFilteredProducts(
    {
      category,
      query,
      maxPrice,
      stockOnly,
      promoOnly,
      localOnly,
      minRating,
      sort,
    },
    apiProducts,
  );

  const filterCategories = categories.filter((item) => shopCategoryFilters.includes(item.slug));
  const categoryLabel = getCategoryLabel(category);
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
                    <strong>120+</strong>
                    <span className="text-secondary small">Produits</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className={styles.shopStatCard}>
                    <strong>{categories.length}</strong>
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
                <span className="badge rounded-pill bg-warning text-dark mb-2">Offres flash</span>
                <h2 className="h3 fw-bold mb-1">Prix spéciaux sur les téléphones et accessoires</h2>
                <p className={styles.bannerText}>
                  Profitez des bonnes affaires locales avant la fin des promos.
                </p>
              </div>
              <div className="col-lg-4 text-lg-end">
                <Link href="/boutique?promo=1" className="btn btn-light fw-bold">
                  Voir les promos
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
                selectedCategory={category}
                query={query}
                maxPrice={maxPrice}
                maxPriceLimit={maxCatalogPrice}
                minPriceLimit={minCatalogPrice}
                stockOnly={stockOnly}
                promoOnly={promoOnly}
                localOnly={localOnly}
                minRating={minRating}
                sort={sort}
                view={view}
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

              {filteredProducts.length > 0 ? (
                <nav className={styles.paginationNav} aria-label="Pagination boutique">
                  <ul className={styles.paginationList}>
                    <li>
                      <span className={styles.paginationDisabled}>Précédent</span>
                    </li>
                    <li>
                      <span className={styles.paginationActive}>1</span>
                    </li>
                    <li>
                      <Link href="/boutique" className={styles.paginationLink}>
                        2
                      </Link>
                    </li>
                    <li>
                      <Link href="/boutique" className={styles.paginationLink}>
                        3
                      </Link>
                    </li>
                    <li>
                      <Link href="/boutique" className={styles.paginationLink}>
                        Suivant
                      </Link>
                    </li>
                  </ul>
                </nav>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.newsletterSection}>
        <div className="container">
          <NewsletterBanner />
        </div>
      </section>
    </>
  );
}
