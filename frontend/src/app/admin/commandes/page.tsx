/**
 * Route: app/admin/commandes/page
 *
 * Rôle : liste des commandes (admin, toutes). Server Component protégé.
 * Sécurité : requireAdmin() + backend requireRole("admin"). force-dynamic.
 */

import type { Metadata } from "next";
import Link from "next/link";
import AdminOrdersTable from "@/components/admin/AdminOrdersTable";
import { getAdminOrders, requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin — Commandes" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();

  const result = await getAdminOrders({ limit: 50 });
  const loadError = result === null;
  const orders = result?.items ?? [];

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/admin">Administration</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Commandes
          </li>
        </ol>
      </nav>

      <h1 className="h3 fw-bold mb-4">Commandes</h1>

      {loadError ? (
        <div className="bg-white rounded-3 shadow-sm p-5 text-center">
          <p className="text-secondary mb-3">Impossible de charger les commandes.</p>
          <Link href="/admin/commandes" className="btn btn-dark">
            Réessayer
          </Link>
        </div>
      ) : (
        <AdminOrdersTable orders={orders} />
      )}
    </section>
  );
}
