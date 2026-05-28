/**
 * Composant: OrdersHistory (Client Component)
 *
 * Rôle du fichier :
 *   Liste interactive de l'historique commandes. Reçoit les commandes
 *   (déjà récupérées côté serveur) et gère, EN MÉMOIRE côté client :
 *     - la recherche par référence (sous-chaîne) ;
 *     - le filtre par statut (6 statuts backend) ;
 *     - l'état « aucun résultat de recherche » ;
 *     - l'état « aucune commande » (compte sans historique).
 *
 * Où il est utilisé :
 *   - app/commandes/page.tsx (qui fournit `orders` via getMyOrders côté
 *     serveur — le JWT n'est jamais exposé au client).
 *
 * Prérequis / sécurité :
 *   - Reçoit des `PublicOrder` déjà filtrées par ownership côté backend
 *     (customer === utilisateur du JWT). Aucune requête réseau ici.
 *   - Aucune action de modification de statut (lecture seule).
 *
 * Note pour GitHub Copilot :
 *   - La recherche/le filtre sont purement client (pas de re-fetch).
 *   - `import type { PublicOrder }` (effacé) : pas de fuite serveur.
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import OrderCard from "@/components/orders/OrderCard";
import OrdersToolbar from "@/components/orders/OrdersToolbar";
import type { PublicOrder } from "@/lib/orders";

type Props = {
  orders: PublicOrder[];
};

export default function OrdersHistory({ orders }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "all" ? true : order.status === status;
      const matchesQuery = q
        ? order.reference.toLowerCase().includes(q)
        : true;
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  // Aucune commande du tout (compte sans historique).
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3 shadow-sm p-5 text-center">
        <i
          className="bi bi-bag-x d-block mb-3"
          style={{ fontSize: "2.5rem", color: "var(--mf-orange)" }}
          aria-hidden="true"
        ></i>
        <h2 className="h4 fw-bold">Aucune commande pour le moment</h2>
        <p className="text-secondary mb-4">
          Vous n&apos;avez pas encore passé de commande. Découvrez les
          produits des vendeurs locaux de Sangarédi.
        </p>
        <Link href="/boutique" className="btn btn-warning fw-bold">
          <i className="bi bi-bag me-1" aria-hidden="true"></i>
          Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <>
      <OrdersToolbar
        count={filtered.length}
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3 shadow-sm p-5 text-center">
          <i
            className="bi bi-search d-block mb-3"
            style={{ fontSize: "2.5rem", color: "var(--mf-orange)" }}
            aria-hidden="true"
          ></i>
          <h2 className="h5 fw-bold">Aucune commande ne correspond</h2>
          <p className="text-secondary mb-4">
            Ajustez votre recherche ou le filtre de statut.
          </p>
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        filtered.map((order) => (
          <OrderCard key={order.reference} order={order} />
        ))
      )}
    </>
  );
}
