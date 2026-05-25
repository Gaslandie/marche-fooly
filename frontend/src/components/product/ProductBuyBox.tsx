/**
 * Composant: ProductBuyBox (Client Component)
 *
 * Rôle du fichier :
 *   Petit bloc interactif de la fiche produit qui coordonne le sélecteur
 *   de quantité et les actions d'ajout au panier. Garde ProductDetails
 *   en Server Component (rendu statique du gros de la page) et n'isole
 *   côté client QUE ce qui doit l'être (qty + boutons).
 *
 *   Structure :
 *     - Quantité (label + QuantitySelector contrôlé)
 *     - « Ajouter au panier »      → <AddToCartButton variant="default">
 *     - « Acheter maintenant »     → <AddToCartButton variant="buy-now">
 *     - « Ajouter aux favoris »    → Link (logique favoris hors scope Jour 23)
 *
 * Où il est utilisé :
 *   - components/product/ProductDetails.tsx
 *
 * Règles métier / sécurité :
 *   - La quantité saisie est PARTAGÉE entre les deux boutons d'achat
 *     pour éviter toute incohérence (l'utilisateur voit la même valeur
 *     que celle envoyée au panier).
 *   - Aucun prix ni total n'est manipulé ici (le backend reste source
 *     de vérité — cf. AddToCartButton).
 *
 * Note pour GitHub Copilot :
 *   - QuantitySelector est passé en mode contrôlé (`value` + `onChange`).
 *   - Le composant ne fait QUE de l'UI ; toute la logique d'ajout est
 *     dans AddToCartButton (via useCart()).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/cart/AddToCartButton";
import QuantitySelector from "@/components/product/QuantitySelector";
import type { ProductItem } from "@/types/catalog";

type Props = {
  product: ProductItem;
};

export default function ProductBuyBox({ product }: Props) {
  const [quantity, setQuantity] = useState(1);

  return (
    <>
      {/* Quantité + Ajouter au panier */}
      <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
        <div>
          <label className="form-label fw-bold d-block">Quantité</label>
          <QuantitySelector value={quantity} onChange={setQuantity} max={100} />
        </div>
        <div className="flex-grow-1">
          <AddToCartButton product={product} quantity={quantity} />
        </div>
      </div>

      {/* Acheter maintenant + Ajouter aux favoris */}
      <div className="d-grid gap-2 d-sm-flex mb-4">
        <div className="flex-fill">
          <AddToCartButton
            product={product}
            quantity={quantity}
            variant="buy-now"
          />
        </div>
        <Link href="/favoris" className="btn btn-outline-dark flex-fill">
          <i className="bi bi-heart me-1" aria-hidden="true"></i>
          Ajouter aux favoris
        </Link>
      </div>
    </>
  );
}
