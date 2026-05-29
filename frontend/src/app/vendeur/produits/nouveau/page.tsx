/**
 * Route: app/vendeur/produits/nouveau/page
 *
 * Rôle du fichier :
 *   Page de création d'un produit vendeur. Server Component protégé qui
 *   charge les options de catégories puis rend le formulaire (Client).
 *
 * Sécurité :
 *   - non connecté        -> redirect("/mon-compte")
 *   - pas vendeur approved -> redirect("/vendeur")
 *   On revalide TOUJOURS `sellerProfile.status` côté serveur (jamais
 *   `user.role` seul). Le backend re-vérifie aussi à la création.
 *   - `dynamic = "force-dynamic"` : dépend du cookie de session.
 *
 * Note pour GitHub Copilot :
 *   - getCategoryOptions() fournit { id, name } pour le <select>
 *     (POST /api/products attend `category` = ObjectId).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SellerProductForm from "@/components/seller/SellerProductForm";
import { getCategoryOptions } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getMySellerProfile } from "@/lib/seller";

export const metadata: Metadata = {
  title: "Nouveau produit",
  description: "Ajoutez un produit à votre boutique Marché Fooly.",
};

export const dynamic = "force-dynamic";

export default async function NouveauProduitPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/mon-compte");

  const profile = await getMySellerProfile();
  if (!profile || profile.status !== "approved") redirect("/vendeur");

  const categories = await getCategoryOptions();

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/vendeur">Espace vendeur</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Nouveau produit
          </li>
        </ol>
      </nav>

      <h1 className="h3 fw-bold mb-4">Ajouter un produit</h1>

      <div className="row">
        <div className="col-lg-8">
          <SellerProductForm mode="create" categories={categories} />
        </div>
      </div>
    </section>
  );
}
