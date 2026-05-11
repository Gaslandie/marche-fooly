import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductDetails from "@/components/product/ProductDetails";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { getCategoryLabel, products } from "@/data/products";
import styles from "@/styles/product.module.css";
import catalogStyles from "@/styles/catalog.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.name,
    description: `Achetez ${product.name} sur Marché Fooly, marketplace locale à Sangarédi. Vendeur : ${product.vendor}.`,
  };
}

export default async function ProduitPage({ params }: PageProps) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const categoryLabel = getCategoryLabel(product.categorySlug);

  const similar = [
    ...products.filter(
      (p) => p.categorySlug === product.categorySlug && p.slug !== product.slug,
    ),
    ...products.filter(
      (p) => p.categorySlug !== product.categorySlug && p.slug !== product.slug,
    ),
  ].slice(0, 4);

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
            {similar.map((p) => (
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
