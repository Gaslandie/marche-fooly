import type { NextConfig } from "next";

/**
 * Configuration Next.js — Marché Fooly (frontend).
 *
 * Objectifs de ce fichier :
 *   1. Images : servir des formats modernes (AVIF puis WebP) pour alléger
 *      fortement le poids des visuels via l'optimiseur `next/image`.
 *   2. Sécurité / discrétion : retirer l'en-tête `X-Powered-By`, désactiver
 *      les source maps navigateur en production (le code reste minifié et
 *      non « lisible »), et poser quelques en-têtes de sécurité standards.
 *
 * Note importante (honnêteté technique) :
 *   Il est IMPOSSIBLE de cacher totalement le code d'un site web : le
 *   navigateur doit le télécharger et l'exécuter. On réduit ici la surface
 *   (minification, pas de source maps, pas d'info serveur exposée), ce qui
 *   est la bonne pratique réaliste.
 */

/**
 * Construit le `remotePattern` autorisant l'optimiseur d'images à charger les
 * médias publics servis par l'API backend (`/api/media/images/...`).
 * Dérivé de NEXT_PUBLIC_API_URL pour rester correct en dev comme en prod.
 */
function apiImageRemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol === "https:" ? "https" : "http",
        hostname: url.hostname,
        port: url.port || undefined,
        pathname: "/api/media/images/**",
      },
    ];
  } catch {
    return [];
  }
}

const securityHeaders = [
  // Même durée que la protection HTTPS déjà fournie par Vercel.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  // Empêche le navigateur de « deviner » un type MIME différent (anti-sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Anti-clickjacking : le site ne peut être embarqué que par lui-même.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Limite les informations de provenance envoyées vers l'extérieur.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Coupe des API sensibles non utilisées par défaut.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ne pas exposer « X-Powered-By: Next.js ».
  poweredByHeader: false,
  // Pas de source maps navigateur en production (code non « lisible »).
  productionBrowserSourceMaps: false,
  images: {
    // AVIF (meilleure compression) avec repli WebP puis format d'origine.
    formats: ["image/avif", "image/webp"],
    remotePatterns: apiImageRemotePatterns(),
    // Recontrôler rapidement une photo dont le produit n'est plus public.
    minimumCacheTTL: 60,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "marche-fooly\\.vercel\\.app" }],
        destination: "https://www.marchefooly.com/:path*",
        permanent: true,
      },
      { source: "/favicon.ico", destination: "/icon.png", permanent: true },
      { source: "/apple-touch-icon.png", destination: "/apple-icon.png", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/images/:path*",
        // Ces noms ne sont pas versionnés : revalidation après une heure.
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
