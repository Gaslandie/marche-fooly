import type { Metadata } from "next";
import Link from "next/link";
import CartView from "@/components/cart/CartView";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import styles from "@/styles/cart.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Panier",
  description:
    "Consultez votre panier Marché Fooly, ajustez vos quantités et finalisez vos achats auprès des vendeurs locaux de Sangarédi.",
};

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
  return (
    <>
      {/* ── Hero (Server) ─────────────────────────────────────────── */}
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

      {/* ── Contenu panier (Client : useCart) ─────────────────────── */}
      <CartView />

      {/* ── Pourquoi FOOLY (Server, statique) ─────────────────────── */}
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
