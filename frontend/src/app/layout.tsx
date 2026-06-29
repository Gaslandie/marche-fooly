import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import CartProvider from "@/components/cart/CartProvider";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TopBar from "@/components/layout/TopBar";
import { siteConfig } from "@/config/site";
import { getSellerNavigationState } from "@/lib/sellerNavigation";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: `${siteConfig.name} — ${siteConfig.slogan}. Marketplace locale à ${siteConfig.location}.`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, sellerStatus, showSellerEntry } =
    await getSellerNavigationState();

  return (
    <html lang="fr" className={inter.className}>
      <body>
        {/* CartProvider : Context panier disponible partout (Header, pages,
            checkout). Le Provider est un Client Component ; le layout reste
            un Server Component. Pas d'impact sur le rendu statique des pages
            qui ne consomment pas useCart(). */}
        <CartProvider>
          <TopBar sellerStatus={sellerStatus} showSellerEntry={showSellerEntry} />
          <Header
            user={user}
            sellerStatus={sellerStatus}
            showSellerEntry={showSellerEntry}
          />
          <main>{children}</main>
          <Footer sellerStatus={sellerStatus} showSellerEntry={showSellerEntry} />
        </CartProvider>
      </body>
    </html>
  );
}
