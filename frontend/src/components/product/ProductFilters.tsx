"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "@/styles/catalog.module.css";
import { getSellerCta, hasSellerProfileStatus } from "@/lib/sellerCta";
import { formatPrice } from "@/utils/formatPrice";
import type { CategoryItem } from "@/types/catalog";
import type { SellerCtaStatus } from "@/lib/sellerCta";

type ProductFiltersProps = {
  categories: CategoryItem[];
  totalProducts: number;
  selectedCategory?: string;
  query?: string;
  maxPrice: number;
  maxPriceLimit: number;
  minPriceLimit: number;
  stockOnly: boolean;
  sort?: string;
  view?: string;
  sellerStatus: SellerCtaStatus;
  showSellerEntry: boolean;
};

export default function ProductFilters({
  categories,
  totalProducts,
  selectedCategory,
  query,
  maxPrice,
  maxPriceLimit,
  minPriceLimit,
  stockOnly,
  sort,
  view,
  sellerStatus,
  showSellerEntry,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangeValue, setRangeValue] = useState(String(maxPrice));
  const sellerCta = getSellerCta(sellerStatus);
  const hasSellerStatus = hasSellerProfileStatus(sellerStatus);

  const baseParams = useMemo(() => {
    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (sort) params.set("sort", sort);
    if (view) params.set("view", view);
    if (stockOnly) params.set("stock", "1");
    if (maxPrice && maxPrice !== maxPriceLimit) params.set("maxPrice", String(maxPrice));

    return params;
  }, [maxPrice, maxPriceLimit, query, sort, stockOnly, view]);

  const buildCategoryHref = (categorySlug?: string) => {
    const params = new URLSearchParams(baseParams.toString());

    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }

    const queryString = params.toString();
    return queryString ? `/boutique?${queryString}` : "/boutique";
  };

  return (
    <>
      <button
        type="button"
        className={`btn btn-outline-dark d-lg-none ${styles.mobileFilterButton}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <i className="bi bi-sliders me-1" aria-hidden="true"></i>
        {isOpen ? "Masquer les filtres" : "Afficher les filtres"}
      </button>

      <div className={isOpen ? "d-block" : "d-none d-lg-block"}>
        <aside className={styles.filterPanel}>
          <div className={styles.filterHeader}>
            <h2 className={styles.filterTitle}>Filtres</h2>
            <Link href="/boutique" className="small fw-bold text-warning-emphasis">
              Réinitialiser
            </Link>
          </div>

          <div className={styles.filterGroup}>
            <h3>Catégories</h3>
            <div className={styles.categoryFilterList}>
              <Link
                href={buildCategoryHref()}
                className={[styles.categoryFilterLink, !selectedCategory ? styles.categoryFilterLinkActive : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span>Tout voir</span>
                <span className={styles.filterCount}>{totalProducts}</span>
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={buildCategoryHref(category.slug)}
                  className={[
                    styles.categoryFilterLink,
                    selectedCategory === category.slug ? styles.categoryFilterLinkActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span>{category.name}</span>
                  <span className={styles.filterCount}>{category.productCount}</span>
                </Link>
              ))}
            </div>
          </div>

          <form action="/boutique" method="get">
            {query ? <input type="hidden" name="q" value={query} /> : null}
            {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
            {sort ? <input type="hidden" name="sort" value={sort} /> : null}
            {view ? <input type="hidden" name="view" value={view} /> : null}

            {maxPriceLimit > minPriceLimit && (
              <div className={styles.filterGroup}>
                <h3>Budget</h3>
                <div className={styles.priceRangeBox}>
                  <div className={styles.rangeValues}>
                    <span>{formatPrice(minPriceLimit, "GNF")}</span>
                    <span>{formatPrice(Number(rangeValue), "GNF")}</span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min={minPriceLimit}
                    max={maxPriceLimit}
                    step={5000}
                    name="maxPrice"
                    value={rangeValue}
                    onChange={(event) => setRangeValue(event.target.value)}
                    aria-label="Budget maximum"
                  />
                </div>
              </div>
            )}

            <div className={styles.filterGroup}>
              <h3>Disponibilité</h3>
              <div className={`form-check mb-2 ${styles.formCheck}`}>
                <input className="form-check-input" type="checkbox" name="stock" value="1" id="stock" defaultChecked={stockOnly} />
                <label className="form-check-label fw-semibold" htmlFor="stock">
                  En stock
                </label>
              </div>
            </div>

            <div className={styles.filterActions}>
              <button type="submit" className="btn btn-warning w-100 fw-semibold">
                Appliquer les filtres
              </button>
            </div>
          </form>

          {showSellerEntry && (
            <div className={styles.sellerMiniCard}>
              <i className={sellerCta.icon} aria-hidden="true"></i>
              <h3>{hasSellerStatus ? "Votre espace vendeur" : "Vous vendez aussi ?"}</h3>
              <p className={styles.filtersMeta}>
                {hasSellerStatus
                  ? "Suivez votre boutique, votre demande ou vos commandes."
                  : "Créez votre boutique et touchez les clients de Sangarédi."}
              </p>
              <Link href={sellerCta.href} className="btn btn-warning btn-sm w-100 fw-semibold">
                {sellerCta.label}
              </Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
