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
 * médias servis par l'API backend (photos produits en `/api/uploads/...`).
 * Dérivé de NEXT_PUBLIC_API_URL pour rester correct en dev comme en prod.
 */
function apiImageRemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol === "https:" ? "https" : "http",
        hostname: url.hostname,
        port: url.port || undefined,
        pathname: "/api/**",
      },
    ];
  } catch {
    return [];
  }
}

const securityHeaders = [
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
    // Garde les variantes optimisées en cache au moins 1h côté CDN/navigateur.
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
