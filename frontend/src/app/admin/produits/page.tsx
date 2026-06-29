/**
 * Route: app/admin/produits/page
 *
 * Rôle : liste des produits (admin, tous statuts). Server Component protégé.
 * Sécurité : requireAdmin() + backend requireRole("admin"). force-dynamic.
 */

import type { Metadata } from "next";
import Link from "next/link";
import AdminProductsTable from "@/components/admin/AdminProductsTable";
import { getAdminProducts, requireBackOffice } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin — Produits" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireBackOffice();

  const result = await getAdminProducts({ limit: 50 });
  const loadError = result === null;
  const products = result?.items ?? [];

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/admin">Administration</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Produits
          </li>
        </ol>
      </nav>

      <h1 className="h3 fw-bold mb-4">Produits</h1>

      {loadError ? (
        <div className="bg-white rounded-3 shadow-sm p-5 text-center">
          <p className="text-secondary mb-3">Impossible de charger les produits.</p>
          <Link href="/admin/produits" className="btn btn-dark">
            Réessayer
          </Link>
        </div>
      ) : (
        <AdminProductsTable products={products} />
      )}
    </section>
  );
}
