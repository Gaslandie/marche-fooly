import type { Metadata } from "next";
import HomePage from "@/components/sections/HomePage";
import { getSellerNavigationState } from "@/lib/sellerNavigation";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "Achetez et vendez facilement à Sangarédi avec Marché Fooly, la marketplace locale pour produits, services et bonnes affaires.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sellerStatus, showSellerEntry } = await getSellerNavigationState();

  return (
    <HomePage
      sellerStatus={sellerStatus}
      showSellerEntry={showSellerEntry}
    />
  );
}
