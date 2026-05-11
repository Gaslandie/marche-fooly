"use client";

import { useState } from "react";
import styles from "@/styles/orders.module.css";

type Props = {
  count: number;
};

export default function OrdersToolbar({ count }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  return (
    <div className={styles.toolbar}>
      <span className="fw-bold" style={{ color: "var(--mf-orange)" }}>
        {count} commande{count > 1 ? "s" : ""}
      </span>

      <div className="d-flex align-items-center gap-2 ms-auto flex-wrap">
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Rechercher une commande…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: "180px", borderRadius: "10px" }}
          aria-label="Rechercher une commande"
        />
        <select
          className="form-select form-select-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "auto", borderRadius: "10px" }}
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="done">Livrés</option>
          <option value="cancelled">Annulés</option>
        </select>
      </div>
    </div>
  );
}
