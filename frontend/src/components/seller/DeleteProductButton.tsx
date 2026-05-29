/**
 * Composant: DeleteProductButton (Client Component)
 *
 * Rôle du fichier :
 *   Bouton « Supprimer » d'un produit vendeur. Demande confirmation puis
 *   appelle le Route Handler interne DELETE /api/seller/products/[id]
 *   (soft-delete côté backend). Rafraîchit la liste après succès.
 *
 * Où il est utilisé :
 *   - components/seller/SellerProductList.tsx
 *
 * Règles de sécurité :
 *   - Aucun JWT manipulé : le cookie httpOnly est lu côté serveur par le
 *     Route Handler, qui ajoute le Bearer.
 *   - L'ownership est garanti par le backend (un vendeur ne supprime que
 *     ses produits) : on relaie son message d'erreur le cas échéant.
 *
 * Note pour GitHub Copilot :
 *   - DELETE = soft-delete (status archived) -> le produit disparaît de
 *     la liste publique `?seller=` après `router.refresh()`.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  productName: string;
};

export default function DeleteProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer « ${productName} » ?\n\nLe produit sera archivé et n'apparaîtra plus dans votre boutique.`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        window.alert(body?.message ?? "Suppression impossible. Réessayez.");
        setBusy(false);
        return;
      }
    } catch {
      window.alert("Service indisponible. Réessayez plus tard.");
      setBusy(false);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-outline-danger btn-sm"
      onClick={handleDelete}
      disabled={busy}
      aria-label={`Supprimer ${productName}`}
    >
      <i className="bi bi-trash me-1" aria-hidden="true"></i>
      {busy ? "Suppression…" : "Supprimer"}
    </button>
  );
}
