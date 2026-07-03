import Link from "next/link";
import ProductBuyBox from "@/components/product/ProductBuyBox";
import ProductGallery from "@/components/product/ProductGallery";
import type { ProductItem } from "@/types/catalog";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/product.module.css";

const TRUST_ITEMS = [
  {
    icon: "bi bi-shield-check",
    title: "Vendeur identifié",
    text: "Produit proposé par une boutique présente sur Marché Fooly.",
  },
  {
    icon: "bi bi-truck",
    title: "Livraison ou retrait",
    text: "Modalités confirmées lors de la commande.",
  },
  {
    icon: "bi bi-headset",
    title: "Support FOOLY",
    text: "Disponible pour les clients et les vendeurs.",
  },
  {
    icon: "bi bi-credit-card",
    title: "Paiement à la livraison",
    text: "Paiement à la livraison ou retrait auprès du vendeur.",
  },
];

type Props = {
  product: ProductItem;
};

export default function ProductDetails({ product }: Props) {
  const categoryLabel = product.categoryName || product.categorySlug;
  const description =
    product.description.trim() ||
    product.shortDescription.trim() ||
    "Aucune description détaillée n'a encore été fournie pour ce produit.";
  const pickupLocation = [
    product.pickupAddress?.city,
    product.pickupAddress?.region,
    product.pickupAddress?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const deliveryLabel = product.isFreeDelivery
    ? "Gratuite"
    : product.deliveryFee > 0
      ? formatPrice(product.deliveryFee, product.currency)
      : "";

  const specs = [
    { label: "Catégorie", value: categoryLabel },
    { label: "Vendeur", value: product.vendor },
    { label: "Disponibilité", value: product.stockLabel },
    { label: "Stock", value: `${product.stockQuantity} unité${product.stockQuantity > 1 ? "s" : ""}` },
    { label: "SKU", value: product.sku },
    { label: "Retrait", value: pickupLocation },
    { label: "Livraison", value: deliveryLabel },
  ].filter(({ value }) => Boolean(value));

  return (
    <>
      {/* ── Main panel ───────────────────────────────────────────── */}
      <div className="row g-4 align-items-start">
        {/* Gallery + Seller */}
        <div className="col-lg-6">
          <ProductGallery
            images={product.images}
            productName={product.name}
            fallbackIcon={product.icon}
            badge={product.badge}
          />

          {/* Seller card */}
          <div className={`${styles.sellerCard} mt-4`}>
            <div className="d-flex align-items-start gap-3 mb-3">
              <div className={styles.sellerAvatar}>
                <i className="bi bi-shop" aria-hidden="true"></i>
              </div>
              <div>
                <h2 className="h5 fw-bold mb-1">{product.vendor}</h2>
                <p className="text-secondary mb-0">Boutique présente sur Marché Fooly</p>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Link href="/contact" className="btn btn-outline-dark btn-sm">
                <i className="bi bi-chat-dots me-1" aria-hidden="true"></i>
                Contacter
              </Link>
              <Link href="/boutique" className="btn btn-light btn-sm fw-bold">
                <i className="bi bi-grid me-1" aria-hidden="true"></i>
                Voir la boutique
              </Link>
            </div>
          </div>
        </div>

        {/* Product info panel */}
        <div className="col-lg-6">
          <div className={styles.productInfoPanel}>
            {/* Meta pills */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className={styles.metaPillSuccess}>
                <i className="bi bi-check-circle" aria-hidden="true"></i>
                {product.stockLabel}
              </span>
              {deliveryLabel && (
                <span className={styles.metaPillOrange}>
                  <i className="bi bi-truck" aria-hidden="true"></i>
                  Livraison : {deliveryLabel}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className={`${styles.productTitle} mb-3`}>{product.name}</h1>

            <p className="text-secondary fw-semibold mb-3">
              Réf : MF-{product.slug.toUpperCase().slice(0, 8)}
            </p>

            {/* Short description */}
            <p className="text-secondary">
              {product.shortDescription || description}
            </p>

            {/* Price */}
            <div className="my-4">
              <div className={styles.productPrice}>
                {formatPrice(product.price, product.currency)}
              </div>
            </div>

            {/* Quantité + ajout panier + acheter maintenant + favoris.
                Isolé dans un Client Component (ProductBuyBox) pour garder
                le reste de ProductDetails en Server Component. */}
            <ProductBuyBox product={product} />

            {/* Trust row */}
            <div className={styles.trustRow}>
              <div className="row g-3">
                {TRUST_ITEMS.map(({ icon, title, text }) => (
                  <div key={title} className="col-md-6">
                    <div className={styles.trustItem}>
                      <span className={styles.trustIcon}>
                        <i className={icon} aria-hidden="true"></i>
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <p className="text-secondary small mb-0">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Description + Specs ──────────────────────────────────── */}
      <div className="row g-4 mt-4">
        <div className="col-lg-7">
          <div className={styles.sectionCard}>
            <h2 className="h4 fw-bold mb-3">Description du produit</h2>
            <p className="text-secondary">
              {description}
            </p>
          </div>
        </div>

        <div className="col-lg-5">
          <div className={styles.sectionCard}>
            <h2 className="h4 fw-bold mb-3">Caractéristiques</h2>
            <div>
              {specs.map(({ label, value }) => (
                <div key={label} className={styles.specRow}>
                  <span className={styles.specLabel}>{label}</span>
                  <span className={styles.specValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
