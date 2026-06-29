import type { Metadata } from "next";
import HomePage from "@/components/sections/HomePage";
import { getCategories, getProducts } from "@/lib/api";
import { getSellerNavigationState } from "@/lib/sellerNavigation";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "Achetez et vendez facilement à Sangarédi avec Marché Fooly, la marketplace locale pour produits, services et bonnes affaires.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [sellerNavigation, categories, products] = await Promise.all([
    getSellerNavigationState(),
    getCategories(),
    getProducts({ limit: 6 }),
  ]);

  return (
    <HomePage
      sellerStatus={sellerNavigation.sellerStatus}
      showSellerEntry={sellerNavigation.showSellerEntry}
      categories={categories}
      products={products}
    />
  );
}
