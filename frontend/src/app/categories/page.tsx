import type { Metadata } from "next";
import Link from "next/link";
import CategoryCard from "@/components/category/CategoryCard";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { getCategories } from "@/lib/api";
import styles from "@/styles/catalog.module.css";

// Cette page dépend d'une API live (GET /api/categories) : on force le rendu
// dynamique (à la requête). Le build Next.js ne contacte donc plus le backend.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catégories",
  description:
    "Explorez toutes les catégories de Marché Fooly : alimentation, téléphones, électroménagers, mode, maison, automobile, meubles, bijoux et plus à Sangarédi.",
};

export default async function CategoriesPage() {
  // Données réelles : API backend (GET /api/categories), déjà triées côté
  // serveur par sortOrder. Pendant le chargement -> app/categories/loading.tsx.
  // En cas d'échec réseau/serveur -> app/categories/error.tsx.
  const categories = await getCategories();

  // L'API n'expose pas de drapeau « featured ». Décision Jour 21 : on retient
  // les 4 premières catégories selon sortOrder comme catégories populaires.
  const featuredCategories = categories.slice(0, 4);
  const popularCategoryChips = featuredCategories;
  const hasCategories = categories.length > 0;

  return (
    <>
      <section className={styles.heroSection}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className={`mb-3 ${styles.breadcrumbNav}`}>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>
                  Accueil
                </Link>
              </li>
              <li className={`breadcrumb-item active ${styles.breadcrumbCurrent}`} aria-current="page">
                Catégories
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className={styles.heroBadge}>
                <i className="bi bi-grid-3x3-gap-fill" aria-hidden="true"></i>
                Rayons marketplace locale
              </span>
              <h1 className={`${styles.heroTitle} mb-3`}>Toutes les catégories Marché Fooly</h1>
              <p className={styles.heroText}>
                Retrouvez rapidement les produits locaux par univers : téléphones, maison,
                électroménager, mode, alimentation, automobile, accessoires et bien plus.
              </p>
            </div>

            <div className="col-lg-5">
              <div className={styles.heroSearchPanel}>
                <h2 className="h5 fw-bold mb-3">Rechercher dans les catégories</h2>
                <form className="d-flex gap-2 mb-3" action="/boutique" method="get">
                  <input
                    className="form-control"
                    type="search"
                    name="q"
                    placeholder="Ex : téléphone, meuble, robe..."
                    aria-label="Rechercher une catégorie"
                  />
                  <button className="btn btn-warning px-3" type="submit">
                    <i className="bi bi-search" aria-hidden="true"></i>
                  </button>
                </form>
                {popularCategoryChips.length > 0 && (
                  <div className={styles.popularChips}>
                    {popularCategoryChips.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/boutique?category=${category.slug}`}
                        className={styles.popularChip}
                      >
                        {category.name.split(" ")[0]}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row g-3 mt-4">
            <div className="col-6 col-lg-3">
              <div className={styles.statsCard}>
                <strong>14+</strong>
                <span className="text-secondary fw-semibold">Catégories principales</span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className={styles.statsCard}>
                <strong>120+</strong>
                <span className="text-secondary fw-semibold">Produits listés</span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className={styles.statsCard}>
                <strong>Local</strong>
                <span className="text-secondary fw-semibold">Sangarédi & environs</span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className={styles.statsCard}>
                <strong>24/7</strong>
                <span className="text-secondary fw-semibold">Vitrine en ligne</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasCategories ? (
        <>
          {featuredCategories.length > 0 && (
            <section className={styles.sectionBlock}>
              <div className="container">
                <div className={`${styles.sectionHeading} ${styles.sectionHeadingCentered}`}>
                  <span className={styles.eyebrow}>Catégories populaires</span>
                  <h2 className={styles.sectionTitle}>Les rayons les plus visités</h2>
                  <p className={styles.sectionDescription}>
                    Les univers clés qui donnent à Marché Fooly l&apos;image d&apos;une vraie marketplace locale complète.
                  </p>
                </div>

                <div className="row g-4">
                  {featuredCategories.map((category) => (
                    <div key={category.slug} className="col-md-6 col-lg-3">
                      <CategoryCard category={category} variant="featured" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className={styles.sectionBlock}>
            <div className="container">
              <div className={`${styles.sectionHeading} ${styles.sectionHeadingSplit}`}>
                <div>
                  <span className={styles.eyebrow}>Tous les rayons</span>
                  <h2 className={styles.sectionTitle}>Explorer par catégorie</h2>
                  <p className={styles.sectionDescription}>
                    Chaque carte mène vers la boutique avec des produits adaptés à chaque univers.
                  </p>
                </div>
                <Link href="/boutique" className="btn btn-outline-dark">
                  Voir toute la boutique
                </Link>
              </div>

              <div className="row g-3">
                {categories.map((category) => (
                  <div key={category.slug} className="col-md-6 col-lg-4">
                    <CategoryCard category={category} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <div className="container">
              <div className={styles.categoryBanner}>
                <div className="row align-items-center g-4 position-relative">
                  <div className="col-lg-8">
                    <span className="badge rounded-pill bg-warning text-dark mb-3">Vendeurs locaux</span>
                    <h2 className="display-6 fw-bold mb-3">Votre catégorie n&apos;est pas encore bien remplie ?</h2>
                    <p className={styles.bannerText}>
                      Marché Fooly peut accueillir de nouveaux vendeurs dans chaque rayon :
                      alimentation, mode, maison, téléphone, électroménager, services et plus.
                    </p>
                  </div>
                  <div className="col-lg-4 text-lg-end">
                    <Link href="/devenir-vendeur" className="btn btn-light fw-bold me-2 mb-2">
                      Créer ma boutique
                    </Link>
                    <Link href="/contact" className="btn btn-outline-light fw-bold mb-2">
                      Nous contacter
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className={styles.sectionBlock}>
          <div className="container">
            <div className={styles.emptyState}>
              <h2>Aucune catégorie disponible pour le moment</h2>
              <p>
                Les rayons de Marché Fooly seront bientôt en ligne. Revenez d&apos;ici peu
                ou explorez directement la boutique pour découvrir les produits locaux.
              </p>
              <Link href="/boutique" className="btn btn-outline-dark mt-3">
                Voir la boutique
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className={styles.newsletterSection}>
        <div className="container">
          <NewsletterBanner />
        </div>
      </section>
    </>
  );
}
