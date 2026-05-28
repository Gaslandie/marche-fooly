/**
 * Composant: OrdersToolbar (Client Component)
 *
 * Rôle du fichier :
 *   Barre d'outils de l'historique commandes : recherche par référence
 *   + filtre par statut. Composant CONTRÔLÉ : il ne détient aucun état,
 *   le parent (OrdersHistory) lui passe les valeurs et les callbacks.
 *
 * Où il est utilisé :
 *   - components/orders/OrdersHistory.tsx
 *
 * Prérequis :
 *   - Les options de statut couvrent les 6 statuts backend
 *     (libellés issus de lib/orderStatus — module PUR).
 *
 * Note pour GitHub Copilot :
 *   - `count` reflète le nombre de commandes APRÈS filtrage (affiché au
 *     parent). La recherche est une sous-chaîne de la référence.
 */

"use client";

import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import styles from "@/styles/orders.module.css";

type Props = {
  count: number;
  query: string;
  onQueryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
};

export default function OrdersToolbar({
  count,
  query,
  onQueryChange,
  status,
  onStatusChange,
}: Props) {
  return (
    <div className={styles.toolbar}>
      <span className="fw-bold" style={{ color: "var(--mf-orange)" }}>
        {count} commande{count > 1 ? "s" : ""}
      </span>

      <div className="d-flex align-items-center gap-2 ms-auto flex-wrap">
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Rechercher une référence…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{ minWidth: "200px", borderRadius: "10px" }}
          aria-label="Rechercher une commande par référence"
        />
        <select
          className="form-select form-select-sm"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{ width: "auto", borderRadius: "10px" }}
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous les statuts</option>
          {ORDER_STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
          <option value="cancelled">{ORDER_STATUS_LABEL.cancelled}</option>
        </select>
      </div>
    </div>
  );
}
