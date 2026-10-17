import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/** Seulement les pages publiques : les espaces personnels restent en noindex. */
export function publicMetadata(
  path: string,
  title: string,
  description: string,
  image?: { url: string; alt: string },
): Metadata {
  const shareTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;
  const shareImage = image ?? {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${siteConfig.name} — ${siteConfig.slogan}, ${siteConfig.location}`,
  };
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: shareTitle,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: "fr_GN",
      type: "website",
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [shareImage],
    },
  };
}
