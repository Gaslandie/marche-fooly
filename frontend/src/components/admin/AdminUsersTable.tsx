/**
 * Composant: AdminUsersTable (Server Component)
 *
 * Rôle : tableau des utilisateurs pour l'admin (lecture seule).
 * Usage : app/admin/utilisateurs/page.tsx.
 * Sécurité : reçoit des `AdminUser` déjà whitelistés (jamais passwordHash).
 */

import type { AdminUser } from "@/lib/admin";

const ROLE_BADGE: Record<string, string> = {
  customer: "bg-secondary",
  seller: "bg-info text-dark",
  admin: "bg-dark",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success",
  pending: "bg-warning text-dark",
  suspended: "bg-danger",
};

export default function AdminUsersTable({ users }: { users: AdminUser[] }) {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-3 shadow-sm p-5 text-center text-secondary">
        Aucun utilisateur.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3 shadow-sm p-3">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr className="text-secondary small">
              <th scope="col">Nom</th>
              <th scope="col">Email</th>
              <th scope="col">Téléphone</th>
              <th scope="col">Rôle</th>
              <th scope="col">Statut</th>
              <th scope="col">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="fw-semibold">
                  {`${u.firstName} ${u.lastName}`.trim() || "—"}
                </td>
                <td>{u.email}</td>
                <td>{u.phone || "—"}</td>
                <td>
                  <span
                    className={`badge rounded-pill ${ROLE_BADGE[u.role] ?? "bg-secondary"}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge rounded-pill ${STATUS_BADGE[u.status] ?? "bg-secondary"}`}
                  >
                    {u.status}
                  </span>
                </td>
                <td>
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
