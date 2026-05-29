/**
 * Composant: AdminSellerActions (Client Component)
 *
 * Rôle du fichier :
 *   Boutons d'action admin sur un vendeur (approuver / rejeter /
 *   suspendre / réactiver), contextualisés selon le statut courant.
 *   Appelle le Route Handler BFF PATCH /api/admin/sellers/[id]/status.
 *
 * Où il est utilisé :
 *   - components/admin/AdminSellersTable.tsx
 *
 * Règles de sécurité / métier :
 *   - Aucun JWT manipulé (cookie httpOnly lu côté serveur par le BFF).
 *   - Body PATCH = `{ status }` UNIQUEMENT.
 *   - Le backend impose requireRole("admin") + la logique métier
 *     (promotion de rôle à l'approbation). Il reste la source de vérité ;
 *     on relaie ses erreurs.
 *   - Rejet / suspension demandent une confirmation explicite.
 *
 * Note pour GitHub Copilot :
 *   - Après succès -> router.refresh() (la table serveur se recharge avec
 *     le nouveau statut).
 *   - Actions proposées selon statut : pending -> approuver/rejeter ;
 *     approved -> suspendre ; suspended -> réactiver ; rejected -> approuver.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  sellerId: string;
  status: string;
  storeName: string;
};

type Action = {
  target: "approved" | "rejected" | "suspended";
  label: string;
  className: string;
  confirm?: string;
};

function actionsFor(status: string, storeName: string): Action[] {
  switch (status) {
    case "pending":
      return [
        { target: "approved", label: "Approuver", className: "btn btn-success btn-sm" },
        {
          target: "rejected",
          label: "Rejeter",
          className: "btn btn-outline-danger btn-sm",
          confirm: `Rejeter la candidature de « ${storeName} » ?`,
        },
      ];
    case "approved":
      return [
        {
          target: "suspended",
          label: "Suspendre",
          className: "btn btn-outline-warning btn-sm",
          confirm: `Suspendre la boutique « ${storeName} » ?`,
        },
      ];
    case "suspended":
      return [
        { target: "approved", label: "Réactiver", className: "btn btn-success btn-sm" },
      ];
    case "rejected":
      return [
        { target: "approved", label: "Approuver", className: "btn btn-success btn-sm" },
      ];
    default:
      return [];
  }
}

export default function AdminSellerActions({ sellerId, status, storeName }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = actionsFor(status, storeName);
  if (actions.length === 0) {
    return <span className="text-secondary small">—</span>;
  }

  async function apply(action: Action) {
    if (action.confirm && !window.confirm(action.confirm)) return;

    setPending(action.target);
    setError(null);

    let ok = false;
    let body: { success?: boolean; message?: string } | null = null;
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.target }),
      });
      ok = res.ok;
      body = await res.json();
    } catch {
      setPending(null);
      setError("Service indisponible. Réessayez.");
      return;
    }

    if (!ok || !body?.success) {
      setPending(null);
      setError(body?.message ?? "Action impossible.");
      return;
    }

    setPending(null);
    router.refresh();
  }

  return (
    <div className="d-flex flex-column align-items-end gap-1">
      <div className="d-inline-flex gap-2">
        {actions.map((action) => (
          <button
            key={action.target}
            type="button"
            className={action.className}
            onClick={() => apply(action)}
            disabled={pending !== null}
          >
            {pending === action.target ? "…" : action.label}
          </button>
        ))}
      </div>
      {error && <span className="text-danger small">{error}</span>}
    </div>
  );
}
