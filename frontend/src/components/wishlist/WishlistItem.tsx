import Link from "next/link";
import type { ProductItem } from "@/types/catalog";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/wishlist.module.css";

function getRatingStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const v = i + 1;
    if (rating >= v) return "bi bi-star-fill";
    if (rating >= v - 0.5) return "bi bi-star-half";
    return "bi bi-star";
  });
}

type Props = {
  product: ProductItem;
};

export default function WishlistItem({ product }: Props) {
  const stars = getRatingStars(product.rating);

  return (
    <article className={styles.wishlistCard}>
      <div className={styles.wishlistMedia}>
        {product.badge && (
          <span className={styles.wishlistBadge}>{product.badge}</span>
        )}
        <Link
          href="/favoris"
          className={styles.wishlistRemove}
          aria-label="Retirer des favoris"
        >
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </Link>
        <i className={product.icon} aria-hidden="true"></i>
      </div>

      <span className={styles.stockPill}>
        <i className="bi bi-check-circle" aria-hidden="true"></i>
        {product.stockLabel}
      </span>

      <h2 className={styles.productTitle}>{product.name}</h2>
      <div className={styles.wishlistVendor}>Vendeur : {product.vendor}</div>

      <div className={styles.rating} aria-label={`Note ${product.rating} sur 5`}>
        {stars.map((cls, i) => (
          <i key={i} className={cls} aria-hidden="true"></i>
        ))}
        <span className="text-secondary ms-1">({product.reviewCount})</span>
      </div>

      <div className={styles.wishlistPrice}>
        {formatPrice(product.price, product.currency)}
      </div>

      <div className={styles.wishlistActions}>
        <Link href="/panier" className="btn btn-warning btn-sm fw-bold">
          Ajouter au panier
        </Link>
        <Link href={`/produit/${product.slug}`} className="btn btn-light btn-sm">
          Voir
        </Link>
      </div>
    </article>
  );
}
