/**
 * Composant: AdminOrdersTable (Server Component)
 *
 * Rôle : tableau des commandes pour l'admin (lecture seule, toutes).
 * Usage : app/admin/commandes/page.tsx.
 */

import type { AdminOrder, AdminRef } from "@/lib/admin";
import { orderStatusClass, orderStatusLabel } from "@/lib/orderStatus";
import { formatPrice } from "@/utils/formatPrice";

function sellerName(seller: AdminRef): string {
  if (seller && typeof seller === "object") return seller.storeName ?? "—";
  return "—";
}

export default function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3 shadow-sm p-5 text-center text-secondary">
        Aucune commande.
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
              <th scope="col">Vendeur</th>
              <th scope="col">Total</th>
              <th scope="col">Statut</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const dateValue = o.placedAt || o.createdAt;
              return (
                <tr key={o.id}>
                  <td className="fw-semibold">{o.reference}</td>
                  <td>{sellerName(o.seller)}</td>
                  <td>{formatPrice(o.totalAmount, o.currency)}</td>
                  <td>
                    <span
                      className={`badge rounded-pill bg-${orderStatusClass(o.status)}`}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                  </td>
                  <td>
                    {dateValue
                      ? new Date(dateValue).toLocaleDateString("fr-FR")
                      : "—"}
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
