import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/config/site";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function trustedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>([siteConfig.url]);
  // Valeurs définies par Vercel, jamais par X-Forwarded-Host fourni par le client.
  if (process.env.VERCEL_ENV === "preview") {
    for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
      if (host) origins.add(`https://${host}`);
    }
  }
  const host = request.headers.get("host") ?? "";
  try {
    const local = new URL(`${request.nextUrl.protocol}//${host}`);
    if (["localhost", "127.0.0.1", "[::1]"].includes(local.hostname)) {
      origins.add(local.origin);
    }
  } catch {
    // Un Host illisible ne donne aucune autorisation supplémentaire.
  }
  return origins;
}

function hasTrustedOrigin(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const allowed = trustedOrigins(request);
  const origin = request.headers.get("origin");
  if (origin !== null) return allowed.has(origin);
  // Repli pour les navigateurs qui omettent Origin ; aucune origine inconnue.
  try {
    return allowed.has(new URL(request.headers.get("referer") ?? "").origin);
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api" || request.nextUrl.pathname.startsWith("/api/")) {
    if (!SAFE_METHODS.has(request.method) && !hasTrustedOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Origine de la requête refusée. Rechargez la page puis réessayez." },
        { status: 403, headers: { "Cache-Control": "private, no-store, max-age=0" } },
      );
    }
    return NextResponse.next();
  }

  // Un code différent à chaque réponse autorise les scripts Next.js légitimes.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").origin;
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    // Bootstrap et React utilisent des attributs style pour les composants.
    "style-src 'self' 'unsafe-inline'",
    // Les anciennes photos externes et les aperçus locaux restent utilisables.
    `img-src 'self' https: data: blob:${isDev || apiOrigin.startsWith("http:") ? ` ${apiOrigin}` : ""}`,
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}${isDev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  // On remplace toute valeur envoyée par le client.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|icon\\.png|apple-icon\\.png|favicon\\.ico|apple-touch-icon\\.png|robots\\.txt|sitemap\\.xml|opengraph-image).*)"],
};
