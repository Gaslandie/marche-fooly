/**
 * Route: app/produit/[slug]/page
 *
 * Rôle du fichier :
 *   Page de détail d'un produit. Connectée à l'API backend via le client
 *   centralisé `src/lib/api.ts`.
 *
 * SOLUTION TEMPORAIRE (option B, Jour 21) :
 *   L'API expose le détail produit sous une route COMPOSITE :
 *     GET /api/products/:sellerSlug/:productSlug
 *   ...alors que cette route frontend n'a qu'UN segment : /produit/[slug].
 *   On contourne en cherchant le produit via la liste (getProductBySlug ->
 *   getProducts({ q: slug })) puis match exact sur `slug`.
 *
 *   LIMITE CONNUE : un slug produit n'est unique QUE par vendeur. Si deux
 *   vendeurs publient le même slug, le premier résultat est affiché.
 *   La vraie solution future sera la route /produit/[sellerSlug]/[productSlug]
 *   (hors périmètre du Jour 21).
 *
 * Rendu :
 *   - Page dynamique (pas de generateStaticParams) : les produits viennent
 *     de l'API, on ne pré-génère donc pas les chemins.
 *   - Chargement -> app/produit/[slug]/loading.tsx
 *   - Erreur     -> app/produit/[slug]/error.tsx
 *   - Produit introuvable -> notFound() (404).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductDetails from "@/components/product/ProductDetails";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { getProductBySlug, getProducts } from "@/lib/api";
import styles from "@/styles/product.module.css";
import catalogStyles from "@/styles/catalog.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Cette page dépend d'une API live (GET /api/products) : on force le rendu
// dynamique (à la requête). Le build Next.js ne contacte donc plus le backend.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // fetch identique mémoïsé par Next : pas de second appel réseau ici.
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.name,
    description: `Achetez ${product.name} sur Marché Fooly, marketplace locale à Sangarédi. Vendeur : ${product.vendor}.`,
  };
}

export default async function ProduitPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const categoryLabel = product.categoryName || product.categorySlug;

  // Produits similaires : même catégorie via l'API, produit courant exclu.
  const similarPool = product.categorySlug
    ? await getProducts({ category: product.categorySlug, limit: 8 })
    : [];
  const similar = similarPool
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);

  return (
    <>
      {/* ── Breadcrumb hero ───────────────────────────────────────── */}
      <section className={styles.pageHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane">
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
              {categoryLabel && (
                <li className="breadcrumb-item">
                  <Link
                    href={`/boutique?category=${product.categorySlug}`}
                    className={styles.breadcrumbLink}
                  >
                    {categoryLabel}
                  </Link>
                </li>
              )}
              <li
                className={`breadcrumb-item active ${styles.breadcrumbCurrent}`}
                aria-current="page"
              >
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </section>

      {/* ── Product detail ────────────────────────────────────────── */}
      <section className={styles.detailWrap}>
        <div className="container">
          <ProductDetails product={product} />
        </div>
      </section>

      {/* ── Similar products ──────────────────────────────────────── */}
      {similar.length > 0 && (
        <section className={styles.similarSection}>
          <div className="container">
            <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
              <div>
                <span className={catalogStyles.eyebrow}>Produits similaires</span>
                <h2 className={catalogStyles.sectionTitle}>Vous aimerez aussi</h2>
                <p className={catalogStyles.sectionDescription}>
                  Des produits proches pour prolonger la navigation et augmenter les ventes.
                </p>
              </div>
              <Link href="/boutique" className="btn btn-outline-dark">
                Retour boutique
              </Link>
            </div>

            <div className="row g-4">
              {similar.map((item) => (
                <div key={item.slug} className="col-sm-6 col-lg-3">
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <section className="py-5" style={{ background: "var(--mf-light)" }}>
        <div className="container">
          <NewsletterBanner />
        </div>
      </section>
    </>
  );
}
