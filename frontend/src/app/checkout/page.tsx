import type { Metadata } from "next";
import Link from "next/link";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import type { CartItemData } from "@/components/cart/CartItem";
import styles from "@/styles/checkout.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Finaliser ma commande",
  description:
    "Complétez vos informations et choisissez votre mode de paiement pour finaliser votre achat sur Marché Fooly à Sangarédi.",
};

const CHECKOUT_ITEMS: CartItemData[] = [
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

export default function CheckoutPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.checkoutHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>
                  Accueil
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/panier" className={styles.breadcrumbLink}>
                  Panier
                </Link>
              </li>
              <li
                className={`breadcrumb-item active ${styles.breadcrumbCurrent}`}
                aria-current="page"
              >
                Paiement
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-bag-check" aria-hidden="true"></i>
                Dernière étape
              </span>
              <h1 className={`${styles.checkoutTitle} mb-3`}>
                Finaliser ma commande
              </h1>
              <p className="fs-5 mb-0" style={{ color: "rgba(255,255,255,0.75)" }}>
                Renseignez vos informations et confirmez votre commande auprès des vendeurs locaux.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link href="/panier" className="btn btn-outline-light">
                <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
                Retour au panier
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Checkout content ──────────────────────────────────────── */}
      <section className={styles.checkoutPage}>
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* Form column */}
            <div className="col-lg-8">
              <CheckoutForm />
            </div>

            {/* Summary column */}
            <div className="col-lg-4">
              <OrderSummary items={CHECKOUT_ITEMS} />
            </div>
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
