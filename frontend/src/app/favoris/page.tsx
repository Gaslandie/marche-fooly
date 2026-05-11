import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import WishlistItem from "@/components/wishlist/WishlistItem";
import WishlistToolbar from "@/components/wishlist/WishlistToolbar";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { products } from "@/data/products";
import styles from "@/styles/wishlist.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Mes favoris",
  description:
    "Retrouvez vos produits favoris sur Marché Fooly et ajoutez-les rapidement au panier pour acheter localement à Sangarédi.",
};

const WISHLIST_SLUGS = [
  "iphone-12-occasion",
  "samsung-a12",
  "television-ecran-plat",
  "sac-tendance-femme",
  "huile-de-soin-naturelle",
  "location-maison-sangaredi",
];

const CATEGORY_CHIPS = [
  { label: "Tous", icon: "bi bi-grid", href: "/favoris", active: true },
  { label: "Téléphones", icon: "bi bi-phone", href: "/boutique?category=telephones-accessoires", active: false },
  { label: "Maison", icon: "bi bi-house", href: "/boutique?category=maison-cuisine", active: false },
  { label: "Mode", icon: "bi bi-bag-heart", href: "/boutique?category=sacs-bijoux", active: false },
  { label: "Électro", icon: "bi bi-tv", href: "/boutique?category=electromenagers", active: false },
];

export default function FavorisPage() {
  const wishlistProducts = products.filter((p) => WISHLIST_SLUGS.includes(p.slug));
  const suggested = products
    .filter((p) => !WISHLIST_SLUGS.includes(p.slug))
    .slice(0, 4);

  const inStockCount = wishlistProducts.filter((p) => p.inStock).length;
  const promoCount = wishlistProducts.filter((p) => p.isPromo).length;
  const localCount = wishlistProducts.filter((p) => p.isLocal).length;

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.wishlistHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>
                  Accueil
                </Link>
              </li>
              <li
                className={`breadcrumb-item active ${styles.breadcrumbCurrent}`}
                aria-current="page"
              >
                Favoris
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-heart-fill" aria-hidden="true"></i>
                Produits sauvegardés
              </span>
              <h1 className={`${styles.wishlistTitle} mb-3`}>Mes favoris</h1>
              <p className="fs-5 text-secondary mb-0">
                Retrouvez rapidement les produits qui vous intéressent et ajoutez-les au
                panier quand vous êtes prêt à commander.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link href="/boutique" className="btn btn-outline-dark">
                <i className="bi bi-bag me-1" aria-hidden="true"></i>
                Découvrir plus de produits
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wishlist content ──────────────────────────────────────── */}
      <section className={styles.wishlistPage}>
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* Left column */}
            <div className="col-lg-9">
              <WishlistToolbar count={wishlistProducts.length} />

              {/* Category chips */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                {CATEGORY_CHIPS.map(({ label, icon, href, active }) => (
                  <Link
                    key={label}
                    href={href}
                    className={`${styles.collectionChip} ${active ? styles.collectionChipActive : ""}`}
                  >
                    <i className={icon} aria-hidden="true"></i>
                    {label}
                  </Link>
                ))}
              </div>

              {/* Wishlist grid */}
              <div className="row g-4">
                {wishlistProducts.map((product) => (
                  <div key={product.slug} className="col-sm-6 col-xl-4">
                    <WishlistItem product={product} />
                  </div>
                ))}
              </div>

              {/* Empty state */}
              <div className={`${styles.emptyWishlist} mt-4`}>
                <div className={styles.emptyWishlistIcon}>
                  <i className="bi bi-search-heart" aria-hidden="true"></i>
                </div>
                <h2 className="h4 fw-bold">Continuez à sauvegarder vos coups de cœur</h2>
                <p className="text-secondary mb-3">
                  Parcourez la boutique et gardez les meilleurs produits pour les retrouver plus tard.
                </p>
                <Link href="/boutique" className="btn btn-outline-dark">
                  Explorer la boutique
                </Link>
              </div>
            </div>

            {/* Right column – summary + tip */}
            <div className="col-lg-3">
              <aside className={styles.wishlistSummary}>
                <h2 className="h4 fw-bold mb-3">Résumé favoris</h2>

                <div className={styles.summaryStat}>
                  <span>Total favoris</span>
                  <strong>{wishlistProducts.length}</strong>
                </div>
                <div className={styles.summaryStat}>
                  <span>En stock</span>
                  <strong>{inStockCount}</strong>
                </div>
                <div className={styles.summaryStat}>
                  <span>Promos</span>
                  <strong>{promoCount}</strong>
                </div>
                <div className={styles.summaryStat}>
                  <span>Vendeurs locaux</span>
                  <strong>{localCount}</strong>
                </div>

                <Link href="/panier" className="btn btn-warning fw-bold w-100 mt-4">
                  Voir mon panier
                </Link>
                <Link href="/boutique" className="btn btn-outline-dark w-100 mt-2">
                  Ajouter d&apos;autres produits
                </Link>
              </aside>

              {/* Tip card */}
              <div className={styles.tipCard}>
                <span className="badge bg-warning text-dark rounded-pill mb-3">
                  Conseil FOOLY
                </span>
                <h2 className="h5 fw-bold">Les bons produits partent vite</h2>
                <p className="mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Ajoutez vos favoris au panier pour ne pas perdre les meilleures offres locales.
                </p>
                <Link href="/panier" className="btn btn-light fw-bold">
                  Passer au panier
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Suggested products ────────────────────────────────────── */}
      <section className={styles.suggestSection}>
        <div className="container">
          <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
            <div>
              <span className={catalogStyles.eyebrow}>Suggestions</span>
              <h2 className={catalogStyles.sectionTitle}>Produits à découvrir</h2>
              <p className={catalogStyles.sectionDescription}>
                Complétez votre liste avec des articles populaires sur Marché Fooly.
              </p>
            </div>
            <Link href="/boutique" className="btn btn-outline-dark">
              Voir toute la boutique
            </Link>
          </div>

          <div className="row g-4">
            {suggested.map((p) => (
              <div key={p.slug} className="col-sm-6 col-lg-3">
                <ProductCard product={p} />
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
