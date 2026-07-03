import Link from "next/link";
import AddToCartButton from "@/components/cart/AddToCartButton";
import RemoveFavoriteButton from "@/components/wishlist/RemoveFavoriteButton";
import type { ProductItem } from "@/types/catalog";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/wishlist.module.css";

type Props = {
  product: ProductItem;
};

export default function WishlistItem({ product }: Props) {
  const hasImage = Boolean(product.coverImageUrl);

  return (
    <article className={styles.wishlistCard}>
      <div className={styles.wishlistMedia}>
        {product.badge && (
          <span className={styles.wishlistBadge}>{product.badge}</span>
        )}
        <RemoveFavoriteButton
          productId={product.productId}
          className={styles.wishlistRemove}
        />
        {hasImage ? (
          <img
            src={product.coverImageUrl}
            alt={product.name}
            className={styles.wishlistImage}
            loading="lazy"
          />
        ) : (
          <i className={product.icon} aria-hidden="true"></i>
        )}
      </div>

      <span className={styles.stockPill}>
        <i className="bi bi-check-circle" aria-hidden="true"></i>
        {product.stockLabel}
      </span>

      <h2 className={styles.productTitle}>{product.name}</h2>
      <div className={styles.wishlistVendor}>Vendeur : {product.vendor}</div>

      <div className={styles.wishlistPrice}>
        {formatPrice(product.price, product.currency)}
      </div>

      <div className={styles.wishlistActions}>
        <AddToCartButton
          product={product}
          className="btn btn-warning btn-sm fw-bold w-100"
        />
        <Link
          href={`/produit/${encodeURIComponent(product.slug)}`}
          className="btn btn-light btn-sm"
        >
          Voir
        </Link>
      </div>
    </article>
  );
}
