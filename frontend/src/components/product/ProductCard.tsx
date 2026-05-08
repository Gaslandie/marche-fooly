import Link from "next/link";
import styles from "@/styles/catalog.module.css";
import type { ProductItem, ProductViewMode } from "@/types/catalog";
import { formatPrice } from "@/utils/formatPrice";

type ProductCardProps = {
  product: ProductItem;
  view?: ProductViewMode;
};

export default function ProductCard({ product, view = "grid" }: ProductCardProps) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;

    if (product.rating >= starValue) {
      return "bi bi-star-fill";
    }

    if (product.rating >= starValue - 0.5) {
      return "bi bi-star-half";
    }

    return "bi bi-star";
  });

  return (
    <article className={[styles.productCard, view === "list" ? styles.productCardList : ""].filter(Boolean).join(" ")}>
      <div className={[styles.productMedia, view === "list" ? styles.productMediaList : ""].filter(Boolean).join(" ")}>
        {product.badge ? <span className={styles.productBadge}>{product.badge}</span> : null}
        <i className={product.icon} aria-hidden="true"></i>
      </div>

      <div className={styles.productBody}>
        <span className={styles.stockPill}>
          <i className="bi bi-check-circle" aria-hidden="true"></i>
          {product.stockLabel}
        </span>

        <h3 className={styles.productTitle}>{product.name}</h3>
        <div className={styles.productVendor}>Vendeur : {product.vendor}</div>

        <div className={styles.rating} aria-label={`Note ${product.rating} sur 5`}>
          {stars.map((iconClass, index) => (
            <i key={`${product.slug}-${index}`} className={iconClass} aria-hidden="true"></i>
          ))}
          <span className={styles.reviewCount}>({product.reviewCount})</span>
        </div>

        <div className={styles.productPrice}>{formatPrice(product.price, product.currency)}</div>

        <div className={styles.productActions}>
          <Link href="/panier" className="btn btn-warning btn-sm">
            Ajouter
          </Link>
          <Link href={`/produit/${product.slug}`} className="btn btn-outline-dark btn-sm">
            Voir
          </Link>
        </div>
      </div>
    </article>
  );
}
