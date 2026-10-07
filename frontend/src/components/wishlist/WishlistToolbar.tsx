"use client";

import { useState } from "react";
import Link from "next/link";
import WishlistItem from "@/components/wishlist/WishlistItem";
import type { ProductItem } from "@/types/catalog";
import styles from "@/styles/wishlist.module.css";

type Props = {
  products: ProductItem[];
};

export default function WishlistToolbar({ products }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [category, setCategory] = useState("");
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const categories = [...new Map(products.map((product) => [product.categorySlug, product.categoryName])).entries()];
  const visible = products.filter((product) => {
    const text = normalize(`${product.name} ${product.vendor} ${product.categoryName}`);
    return terms.every((term) => text.includes(term)) &&
      (!category || product.categorySlug === category) &&
      (sort !== "stock" || product.inStock);
  }).sort((a, b) => sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : 0);

  return (
    <>
    <div className={styles.wishlistToolbar}>
      <div className="row align-items-center g-3">
        <div className="col-md-4">
          <strong role="status">{visible.length} favori{visible.length > 1 ? "s" : ""} affiché{visible.length > 1 ? "s" : ""} sur {products.length}</strong>
          <span className="d-block text-secondary small">Produits sauvegardés récemment</span>
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            type="search"
            placeholder="Rechercher dans mes favoris..."
            aria-label="Rechercher dans les favoris"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ minHeight: "50px", borderRadius: "16px" }}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            aria-label="Trier les favoris"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            style={{ minHeight: "50px", borderRadius: "16px" }}
          >
            <option value="recent">Ajoutés récemment</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="stock">Disponibles en stock</option>
          </select>
        </div>
      </div>
    </div>
    <div className="d-flex flex-wrap gap-2 mb-4" aria-label="Filtrer les favoris par catégorie">
      {[["", "Tous"], ...categories].map(([slug, name]) => (
        <button
          key={slug}
          type="button"
          className={`${styles.collectionChip} ${category === slug ? styles.collectionChipActive : ""}`}
          aria-pressed={category === slug}
          onClick={() => setCategory(slug)}
        >
          {name}
        </button>
      ))}
    </div>
    {visible.length > 0 ? (
      <div className="row g-4">
        {visible.map((product) => (
          <div key={product.slug} className="col-sm-6 col-xl-4">
            <WishlistItem product={product} />
          </div>
        ))}
      </div>
    ) : (
      <div className={`${styles.emptyWishlist} mt-4`}>
        <h2 className="h4 fw-bold">{products.length ? "Aucun favori ne correspond" : "Aucun favori pour le moment"}</h2>
        {products.length ? (
          <button type="button" className="btn btn-outline-dark mt-2" onClick={() => { setQuery(""); setSort("recent"); setCategory(""); }}>
            Effacer les filtres
          </button>
        ) : (
          <>
            <p className="text-secondary mb-3">Parcourez la boutique et sauvegardez les produits qui vous intéressent.</p>
            <Link href="/boutique" className="btn btn-outline-dark">Explorer la boutique</Link>
          </>
        )}
      </div>
    )}
    </>
  );
}
