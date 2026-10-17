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
import { getProductBySlug, getProducts } from "@/lib/api";
import { publicMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import StructuredData from "@/components/common/StructuredData";
import styles from "@/styles/product.module.css";
import catalogStyles from "@/styles/catalog.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Rendu par visiteur ; le catalogue public garde son cache de 60 secondes.
export const revalidate = 0;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // fetch identique mémoïsé par Next : pas de second appel réseau ici.
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return publicMetadata(
    `/produit/${encodeURIComponent(product.slug)}`,
    product.name,
    `Achetez ${product.name} sur Marché Fooly, marketplace locale à Sangarédi. Vendeur : ${product.vendor}.`,
    product.coverImageUrl ? { url: product.coverImageUrl, alt: product.name } : undefined,
  );
}

export default async function ProduitPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const categoryLabel = product.categoryName || product.categorySlug;
  const productUrl = `${siteConfig.url}/produit/${encodeURIComponent(product.slug)}`;
  const breadcrumb = [
    { name: "Accueil", item: `${siteConfig.url}/` },
    { name: "Boutique", item: `${siteConfig.url}/boutique` },
    ...(product.categorySlug ? [{ name: categoryLabel, item: `${siteConfig.url}/boutique?category=${encodeURIComponent(product.categorySlug)}` }] : []),
    { name: product.name, item: productUrl },
  ];

  // Produits similaires : même catégorie via l'API, produit courant exclu.
  const similarPool = product.categorySlug
    ? await getProducts({ category: product.categorySlug, limit: 8 })
    : [];
  const similar = similarPool
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);

  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            "@id": `${productUrl}#product`,
            url: productUrl,
            name: product.name,
            description: product.description.trim() || product.shortDescription.trim() || undefined,
            image: product.coverImageUrl ? [new URL(product.coverImageUrl, siteConfig.url).href] : undefined,
            sku: product.sku || undefined,
            category: categoryLabel || undefined,
            offers: {
              "@type": "Offer",
              url: productUrl,
              price: product.price,
              priceCurrency: product.currency,
              availability: `https://schema.org/${product.inStock ? "InStock" : "OutOfStock"}`,
              seller: product.sellerSlug ? { "@type": "Organization", name: product.vendor } : undefined,
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: breadcrumb.map((entry, index) => ({ "@type": "ListItem", position: index + 1, ...entry })),
          },
        ],
      }} />
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
            <div className="mf-heading-group mb-4">
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

    </>
  );
}
