"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "@/styles/catalog.module.css";
import type { ProductSortKey, ProductViewMode } from "@/types/catalog";

type ProductSortProps = {
  total: number;
  summary: string;
  sort: ProductSortKey;
  view: ProductViewMode;
};

const sortOptions: Array<{ value: ProductSortKey; label: string }> = [
  { value: "recommended", label: "Tri recommandé" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
];

export default function ProductSort({ total, summary, sort, view }: ProductSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || (key === "sort" && value === "recommended") || (key === "view" && value === "grid")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  return (
    <div className={styles.shopToolbar}>
      <div className="row align-items-center g-3">
        <div className="col-md-5">
          <strong className={styles.toolbarTitle}>{total} produits trouvés</strong>
          <span className={styles.toolbarSubtext}>{summary}</span>
        </div>

        <div className="col-md-4">
          <div className={styles.sortWrapper}>
            <select
              className="form-select"
              aria-label="Trier les produits"
              value={sort}
              onChange={(event) => updateParam("sort", event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-md-3 text-md-end">
          <div className={styles.viewButtons}>
            <button
              type="button"
              className={[styles.viewButton, view === "grid" ? styles.viewButtonActive : ""].filter(Boolean).join(" ")}
              onClick={() => updateParam("view", "grid")}
              aria-label="Vue grille"
            >
              <i className="bi bi-grid-3x3-gap" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              className={[styles.viewButton, view === "list" ? styles.viewButtonActive : ""].filter(Boolean).join(" ")}
              onClick={() => updateParam("view", "list")}
              aria-label="Vue liste"
            >
              <i className="bi bi-list-ul" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
