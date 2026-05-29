/**
 * Composant: AdminProductsTable (Server Component)
 *
 * Rôle : tableau des produits pour l'admin (lecture seule, tous statuts).
 * Usage : app/admin/produits/page.tsx.
 */

import type { AdminProduct, AdminRef } from "@/lib/admin";
import { formatPrice } from "@/utils/formatPrice";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Brouillon", cls: "bg-secondary" },
  active: { label: "Actif", cls: "bg-success" },
  out_of_stock: { label: "Rupture", cls: "bg-warning text-dark" },
  archived: { label: "Archivé", cls: "bg-dark" },
};

function sellerName(seller: AdminRef): string {
  if (seller && typeof seller === "object") return seller.storeName ?? "—";
  return "—";
}

export default function AdminProductsTable({
  products,
}: {
  products: AdminProduct[];
}) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3 shadow-sm p-5 text-center text-secondary">
        Aucun produit.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3 shadow-sm p-3">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr className="text-secondary small">
              <th scope="col">Produit</th>
              <th scope="col">Vendeur</th>
              <th scope="col">Prix</th>
              <th scope="col">Stock</th>
              <th scope="col">Statut</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const badge = STATUS[p.status] ?? {
                label: p.status,
                cls: "bg-secondary",
              };
              return (
                <tr key={p.id}>
                  <td className="fw-semibold">{p.name}</td>
                  <td>{sellerName(p.seller)}</td>
                  <td>{formatPrice(p.price, p.currency)}</td>
                  <td>{p.stockQuantity}</td>
                  <td>
                    <span className={`badge rounded-pill ${badge.cls}`}>
                      {badge.label}
                    </span>
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
