/**
 * Composant: SellerOrderList (Server Component)
 *
 * Rôle du fichier :
 *   Tableau des commandes REÇUES par le vendeur (vue orientée vendeur :
 *   référence, date, contact client, lieu, total, statut + lien détail).
 *   Lecture seule — le changement de statut se fait sur la page détail.
 *
 * Où il est utilisé :
 *   - app/vendeur/commandes/page.tsx (rendu pour un vendeur approved).
 *
 * Prérequis / sécurité :
 *   - Reçoit des `PublicOrder` déjà filtrées par ownership backend
 *     (commandes du vendeur connecté). Aucune requête réseau ici.
 *   - Helpers d'affichage PURS (lib/orderStatus) ; aucun code serveur
 *     (next/headers) tiré côté client (le type PublicOrder est en
 *     `import type`).
 *
 * Note pour GitHub Copilot :
 *   - Le vendeur voit le CLIENT (téléphone) et non « le vendeur ».
 *   - Lien détail -> /vendeur/commandes/[reference] (≠ page client
 *     /commande/[reference]).
 */

import Link from "next/link";
import type { PublicOrder } from "@/lib/orders";
import { orderStatusClass, orderStatusLabel } from "@/lib/orderStatus";
import { formatPrice } from "@/utils/formatPrice";

type Props = {
  orders: PublicOrder[];
};

function orderLocation(order: PublicOrder): string {
  if (order.fulfillmentMethod === "seller_pickup") return "Retrait en boutique";
  return order.shippingAddress?.city || "Livraison";
}

export default function SellerOrderList({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3 shadow-sm p-5 text-center">
        <i
          className="bi bi-receipt d-block mb-3"
          style={{ fontSize: "2.5rem", color: "var(--mf-orange)" }}
          aria-hidden="true"
        ></i>
        <h2 className="h5 fw-bold">Aucune commande pour le moment</h2>
        <p className="text-secondary mb-0">
          Les commandes passées sur vos produits apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3 shadow-sm p-3">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr className="text-secondary small">
              <th scope="col">Référence</th>
              <th scope="col">Date</th>
              <th scope="col">Client</th>
              <th scope="col">Lieu</th>
              <th scope="col">Total</th>
              <th scope="col">Statut</th>
              <th scope="col" className="text-end">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const dateValue = order.placedAt || order.createdAt;
              return (
                <tr key={order.reference}>
                  <td className="fw-semibold">{order.reference}</td>
                  <td>
                    {dateValue
                      ? new Date(dateValue).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>{order.customerPhone || "—"}</td>
                  <td>{orderLocation(order)}</td>
                  <td>{formatPrice(order.totalAmount, order.currency)}</td>
                  <td>
                    <span
                      className={`badge rounded-pill bg-${orderStatusClass(order.status)}`}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="text-end">
                    <Link
                      href={`/vendeur/commandes/${order.reference}`}
                      className="btn btn-outline-dark btn-sm"
                    >
                      <i className="bi bi-eye me-1" aria-hidden="true"></i>
                      Voir le détail
                    </Link>
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
