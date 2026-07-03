import Link from "next/link";
import AddToCartButton from "@/components/cart/AddToCartButton";
import styles from "@/styles/catalog.module.css";
import type { ProductItem, ProductViewMode } from "@/types/catalog";
import { formatPrice } from "@/utils/formatPrice";

type ProductCardProps = {
  product: ProductItem;
  view?: ProductViewMode;
};

export default function ProductCard({ product, view = "grid" }: ProductCardProps) {
  const hasImage = Boolean(product.coverImageUrl);

  return (
    <article className={[styles.productCard, view === "list" ? styles.productCardList : ""].filter(Boolean).join(" ")}>
      <div className={[styles.productMedia, view === "list" ? styles.productMediaList : ""].filter(Boolean).join(" ")}>
        {product.badge ? <span className={styles.productBadge}>{product.badge}</span> : null}
        {hasImage ? (
          <img
            src={product.coverImageUrl}
            alt={product.name}
            className={styles.productImage}
            loading="lazy"
          />
        ) : (
          <i className={product.icon} aria-hidden="true"></i>
        )}
      </div>

      <div className={styles.productBody}>
        <span className={styles.stockPill}>
          <i className="bi bi-check-circle" aria-hidden="true"></i>
          {product.stockLabel}
        </span>

        <h3 className={styles.productTitle}>{product.name}</h3>
        <div className={styles.productVendor}>Vendeur : {product.vendor}</div>

        <div className={styles.productPrice}>{formatPrice(product.price, product.currency)}</div>

        <div className={styles.productActions}>
          <AddToCartButton
            product={product}
            className="btn btn-warning btn-sm"
          />
          <Link
            href={`/produit/${encodeURIComponent(product.slug)}`}
            className="btn btn-outline-dark btn-sm"
          >
            Voir
          </Link>
        </div>
      </div>
    </article>
  );
}
