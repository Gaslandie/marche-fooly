import Link from "next/link";
import QuantitySelector from "@/components/product/QuantitySelector";
import { getCategoryLabel } from "@/data/products";
import type { ProductItem } from "@/types/catalog";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/product.module.css";

function getRatingStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const v = i + 1;
    if (rating >= v) return "bi bi-star-fill";
    if (rating >= v - 0.5) return "bi bi-star-half";
    return "bi bi-star";
  });
}

const TRUST_ITEMS = [
  {
    icon: "bi bi-shield-check",
    title: "Vendeur vérifié",
    text: "Produit proposé par un vendeur local identifié.",
  },
  {
    icon: "bi bi-truck",
    title: "Livraison locale",
    text: "Disponible pour Sangarédi et les zones proches.",
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

const REVIEWS = [
  { initial: "A", name: "Aïssatou", rating: 5, text: "Produit bien présenté, prix clair et vendeur facile à identifier." },
  { initial: "M", name: "Mamadou", rating: 4.5, text: "La page donne confiance. Le prix et le bouton achat sont très visibles." },
  { initial: "I", name: "Ibrahima", rating: 4, text: "Très bonne base pour une marketplace locale sérieuse à Sangarédi." },
];

type Props = {
  product: ProductItem;
};

export default function ProductDetails({ product }: Props) {
  const stars = getRatingStars(product.rating);
  const categoryLabel = getCategoryLabel(product.categorySlug);
  const isPhone = product.categorySlug === "telephones-accessoires";
  const oldPrice = product.isPromo ? Math.round(product.price * 1.15) : null;

  const specs = [
    { label: "Catégorie", value: categoryLabel ?? product.categorySlug },
    { label: "Vendeur", value: product.vendor },
    { label: "État", value: "Très bon" },
    { label: "Localisation", value: "Sangarédi" },
    { label: "Disponibilité", value: product.stockLabel },
    ...(isPhone
      ? [
          { label: "Marque", value: product.name.split(" ")[0] },
          { label: "Stockage", value: "64 Go" },
        ]
      : []),
  ];

  const galleryIcons = [product.icon, "bi bi-box-seam", "bi bi-award", "bi bi-tag-fill"];

  return (
    <>
      {/* ── Main panel ───────────────────────────────────────────── */}
      <div className="row g-4 align-items-start">
        {/* Gallery + Seller */}
        <div className="col-lg-6">
          <div className={styles.galleryPanel}>
            <div className={`${styles.mainImage} mb-3`}>
              {product.badge && (
                <span className={styles.galleryBadge}>{product.badge}</span>
              )}
              <i className={`${product.icon} ${styles.mainImageIcon}`} aria-hidden="true"></i>
            </div>

            <div className="row g-3">
              {galleryIcons.map((icon, i) => (
                <div key={i} className="col-3">
                  <button
                    className={`${styles.thumbItem} ${i === 0 ? styles.thumbItemActive : ""}`}
                    type="button"
                    aria-label={i === 0 ? "Vue principale" : `Vue ${i + 1}`}
                  >
                    <i className={icon} aria-hidden="true"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Seller card */}
          <div className={`${styles.sellerCard} mt-4`}>
            <div className="d-flex align-items-start gap-3 mb-3">
              <div className={styles.sellerAvatar}>
                <i className="bi bi-shop" aria-hidden="true"></i>
              </div>
              <div>
                <h2 className="h5 fw-bold mb-1">{product.vendor}</h2>
                <p className="text-secondary mb-2">Vendeur local vérifié à Sangarédi</p>
                <div className={styles.rating}>
                  <i className="bi bi-star-fill" aria-hidden="true"></i>
                  <i className="bi bi-star-fill" aria-hidden="true"></i>
                  <i className="bi bi-star-fill" aria-hidden="true"></i>
                  <i className="bi bi-star-fill" aria-hidden="true"></i>
                  <i className="bi bi-star-half" aria-hidden="true"></i>
                  <span className="text-secondary ms-1">(4.7/5)</span>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-3">
              {[
                { value: "36", label: "Produits" },
                { value: "98%", label: "Satisfaction" },
                { value: "Local", label: "Sangarédi" },
              ].map(({ value, label }) => (
                <div key={label} className="col-4">
                  <div className={styles.sellerStat}>
                    <span className={styles.sellerStatValue}>{value}</span>
                    <span className="text-secondary small">{label}</span>
                  </div>
                </div>
              ))}
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
              {product.isLocal && (
                <span className={styles.metaPillOrange}>
                  <i className="bi bi-lightning-charge" aria-hidden="true"></i>
                  Livraison locale possible
                </span>
              )}
              <span className={styles.metaPill}>
                <i className="bi bi-eye" aria-hidden="true"></i>
                {product.reviewCount * 5} vues
              </span>
            </div>

            {/* Title */}
            <h1 className={`${styles.productTitle} mb-3`}>{product.name}</h1>

            {/* Rating row */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <div
                className={styles.rating}
                aria-label={`Note ${product.rating} sur 5`}
              >
                {stars.map((cls, i) => (
                  <i key={i} className={cls} aria-hidden="true"></i>
                ))}
              </div>
              <span className="text-secondary fw-semibold">
                {product.reviewCount} avis clients
              </span>
              <span className="text-secondary">|</span>
              <span className="text-secondary fw-semibold">
                Réf : MF-{product.slug.toUpperCase().slice(0, 8)}
              </span>
            </div>

            {/* Short description */}
            <p className="text-secondary">
              {product.name} disponible à Sangarédi. Proposé par {product.vendor},
              vendeur local vérifié sur Marché Fooly pour acheter facilement en Guinée.
            </p>

            {/* Price */}
            <div className="my-4">
              <div className={styles.productPrice}>
                {formatPrice(product.price, product.currency)}
              </div>
              {oldPrice && (
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className={styles.oldPrice}>
                    {formatPrice(oldPrice, product.currency)}
                  </span>
                  <span className="badge rounded-pill bg-success">
                    Économie {formatPrice(oldPrice - product.price, product.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Variants – phones only */}
            {isPhone && (
              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <label
                    className="form-label fw-bold"
                    htmlFor={`couleur-${product.slug}`}
                  >
                    Couleur
                  </label>
                  <select
                    className="form-select"
                    id={`couleur-${product.slug}`}
                    defaultValue="Noir"
                  >
                    <option>Noir</option>
                    <option>Bleu</option>
                    <option>Blanc</option>
                    <option>Rouge</option>
                  </select>
                </div>
                <div className="col-sm-6">
                  <label
                    className="form-label fw-bold"
                    htmlFor={`stockage-${product.slug}`}
                  >
                    Stockage
                  </label>
                  <select
                    className="form-select"
                    id={`stockage-${product.slug}`}
                    defaultValue="64 Go"
                  >
                    <option>64 Go</option>
                    <option>128 Go</option>
                  </select>
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
              <div>
                <label className="form-label fw-bold d-block">Quantité</label>
                <QuantitySelector />
              </div>
              <div className="pt-sm-4 flex-grow-1">
                <Link href="/panier" className="btn btn-warning fw-bold w-100">
                  <i className="bi bi-cart-plus me-1" aria-hidden="true"></i>
                  Ajouter au panier
                </Link>
              </div>
            </div>

            {/* Secondary CTAs */}
            <div className="d-grid gap-2 d-sm-flex mb-4">
              <Link href="/panier" className="btn btn-dark fw-bold flex-fill">
                Acheter maintenant
              </Link>
              <Link href="/favoris" className="btn btn-outline-dark flex-fill">
                <i className="bi bi-heart me-1" aria-hidden="true"></i>
                Ajouter aux favoris
              </Link>
            </div>

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
              {product.name} est disponible à Sangarédi via Marché Fooly. Idéal pour
              un usage quotidien, ce produit est proposé par un vendeur local vérifié
              pour vous garantir proximité et confiance.
            </p>
            <p className="text-secondary mb-0">
              Marché Fooly met en avant les vendeurs locaux pour faciliter l&apos;achat
              à Sangarédi et créer une expérience plus proche, plus rapide et plus
              rassurante.
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

      {/* ── Reviews ─────────────────────────────────────────────── */}
      <div className={`${styles.sectionCard} mt-4`}>
        <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
          <div>
            <h2 className="h4 fw-bold mb-1">Avis clients</h2>
            <p className="text-secondary mb-0">
              Ce que disent les acheteurs de Marché Fooly.
            </p>
          </div>
          <Link href="/contact" className="btn btn-outline-dark">
            Laisser un avis
          </Link>
        </div>

        <div className="row g-3">
          {REVIEWS.map(({ initial, name, rating, text }) => {
            const reviewStars = getRatingStars(rating);
            return (
              <div key={name} className="col-md-4">
                <div className={styles.reviewCard}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className={styles.reviewAvatar}>{initial}</div>
                    <div>
                      <strong>{name}</strong>
                      <div className={`${styles.rating} small`}>
                        {reviewStars.map((cls, i) => (
                          <i key={i} className={cls} aria-hidden="true"></i>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-secondary mb-0">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
