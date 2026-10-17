import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getCategories, getPublicProductsPage } from "@/lib/api";

// Aucun appel au catalogue pendant le build ; ses lectures gardent leur cache.
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/", "/boutique", "/categories", "/contact", "/aide", "/devenir-vendeur"];
  const entries = new Map<string, MetadataRoute.Sitemap[number]>(
    pages.map((path) => [path, { url: new URL(path, siteConfig.url).href }]),
  );
  for (const category of await getCategories()) {
    if (category.productCount === 0) continue;
    const path = `/boutique?category=${encodeURIComponent(category.slug)}`;
    entries.set(path, { url: new URL(path, siteConfig.url).href });
  }

  // Un échec API donne une erreur temporaire, jamais un faux sitemap vide.
  let page = 1;
  let totalPages = 1;
  do {
    const data = await getPublicProductsPage({ limit: 100, page });
    totalPages = data.pagination.totalPages;
    for (const product of data.items) {
      const path = `/produit/${encodeURIComponent(product.slug)}`;
      entries.set(path, {
        url: new URL(path, siteConfig.url).href,
        lastModified: product.updatedAt,
      });
    }
    page += 1;
  } while (page <= totalPages);

  return [...entries.values()];
}
