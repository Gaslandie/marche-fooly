/**
 * Route: app/admin/vendeurs/page
 *
 * Rôle : liste des vendeurs (admin) + actions approuver/rejeter/suspendre
 *   (via AdminSellerActions -> BFF PATCH). Server Component protégé.
 * Sécurité : requireAdmin() + backend requireRole("admin"). force-dynamic.
 */

import type { Metadata } from "next";
import Link from "next/link";
import AdminSellersTable from "@/components/admin/AdminSellersTable";
import { canManageOperations, getAdminSellers, requireBackOffice } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin — Vendeurs" };
export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  const currentUser = await requireBackOffice();

  const result = await getAdminSellers({ limit: 50 });
  const loadError = result === null;
  const sellers = result?.items ?? [];

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/admin">Administration</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Vendeurs
          </li>
        </ol>
      </nav>

      <h1 className="h3 fw-bold mb-4">Vendeurs</h1>

      {loadError ? (
        <div className="bg-white rounded-3 shadow-sm p-5 text-center">
          <p className="text-secondary mb-3">Impossible de charger les vendeurs.</p>
          <Link href="/admin/vendeurs" className="btn btn-dark">
            Réessayer
          </Link>
        </div>
      ) : (
        <AdminSellersTable
          sellers={sellers}
          canManageSellers={canManageOperations(currentUser.role)}
        />
      )}
    </section>
  );
}
