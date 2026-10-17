import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./icons.generated.css";
import "./globals.css";
import CartProvider from "@/components/cart/CartProvider";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TopBar from "@/components/layout/TopBar";
import { siteConfig } from "@/config/site";
import { getCategories } from "@/lib/api";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { getSellerNavigationState } from "@/lib/sellerNavigation";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: `${siteConfig.name} — ${siteConfig.slogan}. Marketplace locale à ${siteConfig.location}.`,
  robots: { index: false, follow: false },
  // Le favicon de marque (pin Marché Fooly) est fourni par la convention de
  // fichier Next.js `src/app/icon.png` : Next génère automatiquement la balise
  // <link rel="icon"> correspondante. Inutile de déclarer `icons` ici (cela
  // ferait doublon). Un éventuel `apple-icon.png` peut être ajouté de la même
  // façon plus tard.
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ user, sellerStatus, showSellerEntry }, categories] = await Promise.all([
    getSellerNavigationState(),
    getCategories().catch(() => []),
  ]);
  const unreadNotifications = user ? await getUnreadNotificationCount() : 0;

  return (
    <html lang="fr" className={inter.className}>
      <body>
        <a className="mf-skip-link" href="#main-content">Aller au contenu principal</a>
        {/* CartProvider : Context panier disponible partout (Header, pages,
            checkout). Le Provider est un Client Component ; le layout reste
            un Server Component. Pas d'impact sur le rendu statique des pages
            qui ne consomment pas useCart(). */}
        <CartProvider>
          <TopBar sellerStatus={sellerStatus} showSellerEntry={showSellerEntry} />
          <Header
            categories={categories}
            user={user}
            sellerStatus={sellerStatus}
            showSellerEntry={showSellerEntry}
            unreadNotifications={unreadNotifications}
          />
          <main id="main-content" tabIndex={-1}>{children}</main>
          <Footer
            isAuthenticated={Boolean(user)}
            sellerStatus={sellerStatus}
            showSellerEntry={showSellerEntry}
          />
        </CartProvider>
      </body>
    </html>
  );
}
