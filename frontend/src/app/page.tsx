import type { Metadata } from "next";
import HomePage from "@/components/sections/HomePage";
import { getCategories, getProducts } from "@/lib/api";
import { getSellerNavigationState } from "@/lib/sellerNavigation";
import { publicMetadata } from "@/lib/seo";
import StructuredData from "@/components/common/StructuredData";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = publicMetadata(
  "/",
  "Marché Fooly — Acheter et vendre à Sangarédi",
  "Achetez et vendez facilement à Sangarédi avec Marché Fooly, la marketplace locale pour produits, services et bonnes affaires.",
);

// Rendu par visiteur, avec conservation du cache explicite du catalogue.
export const revalidate = 0;

export default async function Page() {
  const [sellerNavigation, categories, products] = await Promise.all([
    getSellerNavigationState(),
    getCategories(),
    getProducts({ limit: 6 }),
  ]);

  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${siteConfig.url}/#organization`,
            name: siteConfig.name,
            alternateName: "FOOLY",
            url: siteConfig.url,
            logo: `${siteConfig.url}/images/logo/marche-fooly-logo.jpeg`,
            slogan: siteConfig.slogan,
            telephone: siteConfig.phone,
            email: siteConfig.email,
            address: { "@type": "PostalAddress", addressLocality: "Sangarédi", addressCountry: "GN" },
          },
          {
            "@type": "WebSite",
            "@id": `${siteConfig.url}/#website`,
            url: siteConfig.url,
            name: siteConfig.name,
            inLanguage: "fr-GN",
            publisher: { "@id": `${siteConfig.url}/#organization` },
          },
        ],
      }} />
      <HomePage
        sellerStatus={sellerNavigation.sellerStatus}
        showSellerEntry={sellerNavigation.showSellerEntry}
        categories={categories}
        products={products}
      />
    </>
  );
}
