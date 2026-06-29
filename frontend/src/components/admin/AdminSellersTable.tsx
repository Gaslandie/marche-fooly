/**
 * Composant: AdminSellersTable (Server Component)
 *
 * Rôle : tableau des vendeurs pour l'admin, avec actions
 * approuver/rejeter/suspendre (déléguées au Client AdminSellerActions).
 * Usage : app/admin/vendeurs/page.tsx.
 */

import type { AdminSeller, AdminUserRef } from "@/lib/admin";
import AdminSellerActions from "@/components/admin/AdminSellerActions";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-warning text-dark" },
  approved: { label: "Approuvé", cls: "bg-success" },
  rejected: { label: "Rejeté", cls: "bg-danger" },
  suspended: { label: "Suspendu", cls: "bg-secondary" },
};

function userLabel(user: AdminUserRef): { name: string; email: string } {
  if (user && "firstName" in user) {
    return {
      name: `${user.firstName} ${user.lastName}`.trim() || "—",
      email: user.email,
    };
  }
  return { name: "—", email: "" };
}

export default function AdminSellersTable({
  sellers,
  canManageSellers,
}: {
  sellers: AdminSeller[];
  canManageSellers: boolean;
}) {
  if (sellers.length === 0) {
    return (
      <div className="bg-white rounded-3 shadow-sm p-5 text-center text-secondary">
        Aucun vendeur.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3 shadow-sm p-3">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr className="text-secondary small">
              <th scope="col">Boutique</th>
              <th scope="col">Responsable</th>
              <th scope="col">Statut</th>
              <th scope="col">Créé le</th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => {
              const badge = STATUS[s.status] ?? {
                label: s.status,
                cls: "bg-secondary",
              };
              const responsible = userLabel(s.user);
              return (
                <tr key={s.id}>
                  <td>
                    <div className="fw-semibold">{s.storeName}</div>
                    <div className="text-secondary small">{s.slug}</div>
                  </td>
                  <td>
                    <div>{responsible.name}</div>
                    {responsible.email && (
                      <div className="text-secondary small">{responsible.email}</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge rounded-pill ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td>
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="text-end">
                    {canManageSellers ? (
                      <AdminSellerActions
                        sellerId={s.id}
                        status={s.status}
                        storeName={s.storeName}
                      />
                    ) : (
                      <span className="text-secondary small">Lecture seule</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
