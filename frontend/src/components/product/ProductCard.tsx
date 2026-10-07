import Link from "next/link";
import type { ReactNode } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import styles from "@/styles/catalog.module.css";
import type { ProductItem, ProductViewMode } from "@/types/catalog";
import { formatPrice } from "@/utils/formatPrice";

type ProductCardProps = {
  product: ProductItem;
  view?: ProductViewMode;
  mediaAction?: ReactNode;
  headingLevel?: "h2" | "h3";
};

export default function ProductCard({ product, view = "grid", mediaAction, headingLevel: Heading = "h3" }: ProductCardProps) {
  const hasImage = Boolean(product.coverImageUrl);
  // Sur les cartes, on charge la vignette légère (≈480px WebP) plutôt que la
  // grande image (≈1200px) : même rendu visuel, bien moins de bande passante.
  const cardImageUrl = product.coverThumbUrl || product.coverImageUrl;

  return (
    <article className={[styles.productCard, view === "list" ? styles.productCardList : ""].filter(Boolean).join(" ")}>
      <div className={[styles.productMedia, view === "list" ? styles.productMediaList : "", !hasImage ? styles.productMediaEmpty : ""].filter(Boolean).join(" ")}>
        {product.badge ? <span className={styles.productBadge}>{product.badge}</span> : null}
        {mediaAction}
        {hasImage ? (
          <img
            src={cardImageUrl}
            alt={product.name}
            className={styles.productImage}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <i className={product.icon} aria-hidden="true"></i>
        )}
        <span className={`${styles.stockPill} ${styles.productStock} ${!product.inStock ? styles.stockUnavailable : ""}`}>
          <i className={product.inStock ? "bi bi-check-circle" : "bi bi-x-circle"} aria-hidden="true"></i>
          {product.stockLabel}
        </span>
      </div>

      <div className={styles.productBody}>
        <Heading className={styles.productTitle}>{product.name}</Heading>
        <div className={styles.productVendor}>Vendeur : {product.vendor}</div>

        <div className={styles.productFooter}>
          <div className={styles.productPrice}>{formatPrice(product.price, product.currency)}</div>
          <div className={styles.productActions}>
            {/* quantityControls : une fois le produit ajouté, le bouton laisse
                place à un compteur −/+ directement sur la carte (demande
                cliente — assez de place, même sur téléphone). */}
            <AddToCartButton
              product={product}
              className={`btn btn-warning ${styles.productIconButton}`}
              quantityControls
              iconOnly
            />
            <Link
              href={`/produit/${encodeURIComponent(product.slug)}`}
              className={`btn btn-outline-dark ${styles.productIconButton}`}
              aria-label={`Voir ${product.name}`}
              title={`Voir ${product.name}`}
            >
              <i className="bi bi-eye" aria-hidden="true"></i>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
