/**
 * Route: app/vendeur/commandes/page
 *
 * Rôle du fichier :
 *   Liste des commandes reçues par le vendeur. Server Component protégé.
 *
 * Sécurité :
 *   - non connecté         -> redirect("/mon-compte")
 *   - pas vendeur approved -> redirect("/vendeur")
 *   On revalide TOUJOURS `sellerProfile.status` côté serveur (jamais
 *   `user.role` seul). Le backend filtre déjà sur le vendeur connecté.
 *   - `dynamic = "force-dynamic"` : dépend du cookie de session.
 *   - JWT jamais exposé (fetch serveur via cookie httpOnly).
 *
 * Note pour GitHub Copilot :
 *   - getSellerOrders() -> null = échec backend/réseau : on affiche un
 *     état d'erreur inline (loading.tsx/error.tsx complètent).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SellerOrderList from "@/components/seller/SellerOrderList";
import { getCurrentUser } from "@/lib/auth";
import { getMySellerProfile, getSellerOrders } from "@/lib/seller";

export const metadata: Metadata = {
  title: "Mes commandes vendeur",
  description: "Suivez et gérez les commandes reçues sur Marché Fooly.",
};

export const dynamic = "force-dynamic";

export default async function VendeurCommandesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/mon-compte");

  const profile = await getMySellerProfile();
  if (!profile || profile.status !== "approved") redirect("/vendeur");

  const result = await getSellerOrders();
  const loadError = result === null;
  const orders = result?.items ?? [];

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/vendeur">Espace vendeur</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Commandes
          </li>
        </ol>
      </nav>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="h3 fw-bold mb-0">Commandes reçues</h1>
        <Link href="/vendeur" className="btn btn-outline-dark">
          <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
          Retour au tableau de bord
        </Link>
      </div>

      {loadError ? (
        <div className="bg-white rounded-3 shadow-sm p-5 text-center">
          <i
            className="bi bi-wifi-off d-block mb-3 text-warning"
            style={{ fontSize: "2.5rem" }}
            aria-hidden="true"
          ></i>
          <h2 className="h5 fw-bold">Impossible de charger vos commandes</h2>
          <p className="text-secondary mb-4">
            Une erreur est survenue. Vérifiez votre connexion, puis réessayez.
          </p>
          <Link href="/vendeur/commandes" className="btn btn-dark">
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            Réessayer
          </Link>
        </div>
      ) : (
        <SellerOrderList orders={orders} />
      )}
    </section>
  );
}
