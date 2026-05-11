import type { Metadata } from "next";
import Link from "next/link";
import CartItem, { type CartItemData } from "@/components/cart/CartItem";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/cart.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Panier",
  description:
    "Consultez votre panier Marché Fooly, ajustez vos quantités et finalisez vos achats auprès des vendeurs locaux de Sangarédi.",
};

const CART_ITEMS: CartItemData[] = [
  {
    slug: "samsung-a12",
    name: "Téléphone Samsung A12",
    icon: "bi bi-phone",
    vendor: "Boutique Diallo",
    meta: "Couleur : Noir · Stockage : 64 Go",
    price: 1200000,
    currency: "GNF",
    quantity: 1,
  },
  {
    slug: "huile-de-soin-naturelle",
    name: "Huile de peau naturelle",
    icon: "bi bi-droplet-half",
    vendor: "Beauté Locale",
    meta: "Format : 250 ml",
    price: 120000,
    currency: "GNF",
    quantity: 2,
  },
];

const SERVICE_CARDS = [
  {
    icon: "bi bi-geo-alt",
    title: "Produits proches de vous",
    text: "Achetez auprès de vendeurs basés à Sangarédi et dans les environs.",
  },
  {
    icon: "bi bi-shop",
    title: "Vendeurs locaux",
    text: "Chaque produit met en avant le vendeur pour renforcer la confiance.",
  },
  {
    icon: "bi bi-bag-check",
    title: "Achat plus rapide",
    text: "Panier clair, prix visibles et parcours simple jusqu'à la commande.",
  },
];

export default function PanierPage() {
  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = "GNF";

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.cartHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>
                  Accueil
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/boutique" className={styles.breadcrumbLink}>
                  Boutique
                </Link>
              </li>
              <li
                className={`breadcrumb-item active ${styles.breadcrumbCurrent}`}
                aria-current="page"
              >
                Panier
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-cart-check" aria-hidden="true"></i>
                Votre sélection Marché Fooly
              </span>
              <h1 className={`${styles.cartTitle} mb-3`}>Votre panier</h1>
              <p className="fs-5 text-secondary mb-0">
                Vérifiez vos articles, ajustez les quantités et finalisez votre commande
                auprès des vendeurs locaux.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link href="/boutique" className="btn btn-outline-dark">
                <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cart content ──────────────────────────────────────────── */}
      <section className={styles.cartPage}>
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* Left column */}
            <div className="col-lg-8">
              {/* Cart items */}
              <div className={styles.cartCard}>
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-2">
                  <div>
                    <span className="fw-bold" style={{ color: "var(--mf-orange)" }}>
                      Articles sélectionnés
                    </span>
                    <h2 className="h3 fw-bold mb-0">
                      {CART_ITEMS.length} produit{CART_ITEMS.length > 1 ? "s" : ""} dans votre panier
                    </h2>
                  </div>
                  <Link
                    href="/favoris"
                    className="fw-bold align-self-md-end"
                    style={{ color: "var(--mf-orange)" }}
                  >
                    Voir mes favoris
                  </Link>
                </div>

                {CART_ITEMS.map((item) => (
                  <CartItem key={item.slug} {...item} />
                ))}
              </div>

              {/* Promo code */}
              <div className={`${styles.couponCard} mt-4`}>
                <div className="row align-items-center g-3">
                  <div className="col-lg-5">
                    <h2 className="h5 fw-bold mb-1">Code promo</h2>
                    <p className="text-secondary small mb-0">
                      Ajoutez votre coupon pour bénéficier d&apos;une remise.
                    </p>
                  </div>
                  <div className="col-lg-7">
                    <form
                      className="d-flex flex-column flex-sm-row gap-2"
                      action="/panier"
                      method="get"
                    >
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Ex : FOOLY10"
                        aria-label="Code promo"
                        style={{ minHeight: "50px", borderRadius: "16px" }}
                      />
                      <button className="btn btn-warning fw-bold px-4" type="submit">
                        Appliquer
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Continue shopping suggestion */}
              <div className={`${styles.emptyCartBox} mt-4`}>
                <div className={styles.emptyCartIcon}>
                  <i className="bi bi-bag-plus" aria-hidden="true"></i>
                </div>
                <h2 className="h4 fw-bold">Envie d&apos;ajouter d&apos;autres produits ?</h2>
                <p className="text-secondary mb-3">
                  Explorez les catégories populaires et trouvez d&apos;autres bonnes affaires locales.
                </p>
                <Link href="/categories" className="btn btn-outline-dark">
                  Explorer les catégories
                </Link>
              </div>
            </div>

            {/* Right column – summary */}
            <div className="col-lg-4">
              <aside className={styles.summaryCard}>
                <h2 className="h4 fw-bold mb-3">Résumé de commande</h2>

                <div className={styles.summaryLine}>
                  <span>Sous-total</span>
                  <strong>{formatPrice(subtotal, currency)}</strong>
                </div>
                <div className={styles.summaryLine}>
                  <span>Livraison estimée</span>
                  <strong>À confirmer</strong>
                </div>
                <div className={styles.summaryLine}>
                  <span>Remise</span>
                  <strong>{formatPrice(0, currency)}</strong>
                </div>

                <div className={styles.summaryTotal}>
                  <span className={styles.summaryTotalLabel}>Total</span>
                  <strong className={styles.summaryTotalValue}>
                    {formatPrice(subtotal, currency)}
                  </strong>
                </div>

                <Link href="/boutique" className="btn btn-warning fw-bold w-100 mt-4">
                  Passer à la caisse{" "}
                  <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
                </Link>

                <Link href="/boutique" className="btn btn-outline-dark w-100 mt-2">
                  Continuer mes achats
                </Link>

                <div className="mt-4 pt-3 border-top">
                  <div className="d-flex gap-2 mb-2">
                    <i className="bi bi-shield-check text-success" aria-hidden="true"></i>
                    <span className="small text-secondary fw-semibold">
                      Vendeurs locaux identifiés
                    </span>
                  </div>
                  <div className="d-flex gap-2 mb-2">
                    <i
                      className="bi bi-truck"
                      aria-hidden="true"
                      style={{ color: "var(--mf-orange)" }}
                    ></i>
                    <span className="small text-secondary fw-semibold">
                      Livraison locale selon disponibilité
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    <i className="bi bi-headset text-primary" aria-hidden="true"></i>
                    <span className="small text-secondary fw-semibold">
                      Support Marché Fooly
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why FOOLY ─────────────────────────────────────────────── */}
      <section className={styles.whySection}>
        <div className="container">
          <div className="text-center mb-5">
            <span className={catalogStyles.eyebrow}>Pourquoi commander sur FOOLY ?</span>
            <h2 className={catalogStyles.sectionTitle}>
              Une expérience d&apos;achat locale plus simple
            </h2>
          </div>

          <div className="row g-4">
            {SERVICE_CARDS.map(({ icon, title, text }) => (
              <div key={title} className="col-md-4">
                <div className={styles.serviceCard}>
                  <div className={styles.serviceIcon}>
                    <i className={icon} aria-hidden="true"></i>
                  </div>
                  <h3 className="h5 fw-bold">{title}</h3>
                  <p className="text-secondary mb-0">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <section className="py-5" style={{ background: "var(--mf-light)" }}>
        <div className="container">
          <NewsletterBanner />
        </div>
      </section>
    </>
  );
}
