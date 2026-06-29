/**
 * Composant: AdminUsersTable (Server Component)
 *
 * Rôle : tableau des utilisateurs pour le back office.
 * Usage : app/admin/utilisateurs/page.tsx.
 * Sécurité : reçoit des `AdminUser` déjà whitelistés (jamais passwordHash).
 * Les actions de rôle sont affichées uniquement au `owner`.
 */

import type { AdminUser } from "@/lib/admin";
import { canManageTeam } from "@/lib/admin";
import type { AuthUser } from "@/types/auth";
import AdminUserRoleActions from "@/components/admin/AdminUserRoleActions";

const ROLE_BADGE: Record<string, string> = {
  customer: "bg-secondary",
  seller: "bg-info text-dark",
  staff: "bg-primary",
  admin: "bg-dark",
  owner: "bg-warning text-dark",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success",
  pending: "bg-warning text-dark",
  suspended: "bg-danger",
};

const ROLE_LABEL: Record<string, string> = {
  customer: "Client",
  seller: "Vendeur",
  staff: "Staff",
  admin: "Admin",
  owner: "Owner",
};

const EDITABLE_ROLES = ["customer", "staff", "admin"];

export default function AdminUsersTable({
  users,
  currentUser,
}: {
  users: AdminUser[];
  currentUser: AuthUser;
}) {
  const showRoleActions = canManageTeam(currentUser.role);

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
              {showRoleActions && (
                <th scope="col" className="text-end">
                  Gestion rôle
                </th>
              )}
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
                    {ROLE_LABEL[u.role] ?? u.role}
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
                {showRoleActions && (
                  <td className="text-end">
                    {u.role === "owner" || u.id === currentUser.id || !EDITABLE_ROLES.includes(u.role) ? (
                      <span className="text-secondary small">Protégé</span>
                    ) : (
                      <AdminUserRoleActions
                        userId={u.id}
                        currentRole={u.role as "customer" | "staff" | "admin"}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
