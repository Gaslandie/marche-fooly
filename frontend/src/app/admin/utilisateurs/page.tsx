/**
 * Route: app/admin/utilisateurs/page
 *
 * Rôle : liste des utilisateurs (admin). Server Component protégé.
 * Sécurité : requireAdmin() (non connecté -> /mon-compte ; non admin -> /).
 *   Le backend impose aussi requireRole("admin"). dynamic = force-dynamic.
 */

import type { Metadata } from "next";
import Link from "next/link";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { getAdminUsers, requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin — Utilisateurs" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentUser = await requireAdmin();

  const result = await getAdminUsers({ limit: 50 });
  const loadError = result === null;
  const users = result?.items ?? [];

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/admin">Administration</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Utilisateurs
          </li>
        </ol>
      </nav>

      <h1 className="h3 fw-bold mb-4">Utilisateurs</h1>

      {loadError ? (
        <div className="bg-white rounded-3 shadow-sm p-5 text-center">
          <p className="text-secondary mb-3">
            Impossible de charger les utilisateurs.
          </p>
          <Link href="/admin/utilisateurs" className="btn btn-dark">
            Réessayer
          </Link>
        </div>
      ) : (
        <AdminUsersTable users={users} currentUser={currentUser} />
      )}
    </section>
  );
}
