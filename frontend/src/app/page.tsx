import type { Metadata } from "next";
import HomePage from "@/components/sections/HomePage";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "Achetez et vendez facilement à Sangarédi avec Marché Fooly, la marketplace locale pour produits, services et bonnes affaires.",
};

export default function Page() {
  return <HomePage />;
}
