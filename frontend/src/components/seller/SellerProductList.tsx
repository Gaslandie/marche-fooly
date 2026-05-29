/**
 * Composant: SellerProductList (Server Component)
 *
 * Rôle du fichier :
 *   Tableau des produits du vendeur dans le dashboard /vendeur. Affiche
 *   nom, prix, stock, statut, et les actions « Modifier » (lien) +
 *   « Supprimer » (DeleteProductButton client). État vide géré.
 *
 * Où il est utilisé :
 *   - app/vendeur/page.tsx (rendu uniquement pour un vendeur approved).
 *
 * Prérequis / sécurité :
 *   - Reçoit des `ApiProduct` (forme brute API, avec id/status/stock).
 *   - Lecture seule côté serveur ; seule la suppression est interactive
 *     (déléguée au Client Component DeleteProductButton).
 *
 * Note pour GitHub Copilot :
 *   - La liste publique `?seller=` ne contient que active/out_of_stock
 *     (pas de draft/archived) — limite MVP assumée.
 */

import Link from "next/link";
import DeleteProductButton from "@/components/seller/DeleteProductButton";
import type { ApiProduct } from "@/types/api";
import { formatPrice } from "@/utils/formatPrice";

type Props = {
  products: ApiProduct[];
};

function statusBadge(status: string) {
  if (status === "out_of_stock") {
    return { label: "Rupture", className: "bg-warning text-dark" };
  }
  if (status === "active") {
    return { label: "Actif", className: "bg-success" };
  }
  return { label: status, className: "bg-secondary" };
}

export default function SellerProductList({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3 shadow-sm p-5 text-center">
        <i
          className="bi bi-box-seam d-block mb-3"
          style={{ fontSize: "2.5rem", color: "var(--mf-orange)" }}
          aria-hidden="true"
        ></i>
        <h2 className="h5 fw-bold">Aucun produit pour le moment</h2>
        <p className="text-secondary mb-4">
          Ajoutez votre premier produit pour qu&apos;il apparaisse dans la boutique.
        </p>
        <Link href="/vendeur/produits/nouveau" className="btn btn-warning fw-bold">
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
          Ajouter un produit
        </Link>
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
              <th scope="col">Prix</th>
              <th scope="col">Stock</th>
              <th scope="col">Statut</th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const badge = statusBadge(product.status);
              return (
                <tr key={product.id}>
                  <td>
                    <div className="fw-semibold">{product.name}</div>
                    {product.sku && (
                      <div className="text-secondary small">
                        SKU {product.sku}
                      </div>
                    )}
                  </td>
                  <td>{formatPrice(product.price, product.currency)}</td>
                  <td>{product.stockQuantity}</td>
                  <td>
                    <span className={`badge rounded-pill ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <Link
                        href={`/vendeur/produits/${product.id}/modifier`}
                        className="btn btn-outline-dark btn-sm"
                      >
                        <i className="bi bi-pencil me-1" aria-hidden="true"></i>
                        Modifier
                      </Link>
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
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
