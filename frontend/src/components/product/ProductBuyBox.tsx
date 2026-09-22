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
 *     - « Ajouter aux favoris »    → API favoris user-owned
 *
 * Où il est utilisé :
 *   - components/product/ProductDetails.tsx
 *
 * Règles métier / sécurité :
 *   - La quantité saisie est PARTAGÉE entre les deux boutons d'achat
 *     pour éviter toute incohérence (l'utilisateur voit la même valeur
 *     que celle envoyée au panier).
 *   - Le sélecteur REFLÈTE le panier : si le produit y est déjà avec la
 *     quantité 2, il affiche 2, et valider met le panier à la valeur
 *     affichée (mode "set" d'AddToCartButton). Avant le 22/09/2026 il
 *     repartait de 1 et s'AJOUTAIT à l'existant : choisir 4 après un
 *     ajout depuis la carte donnait 5 au panier.
 *   - Aucun prix ni total n'est manipulé ici (le backend reste source
 *     de vérité — cf. AddToCartButton).
 *
 * Note pour GitHub Copilot :
 *   - QuantitySelector est passé en mode contrôlé (`value` + `onChange`).
 *   - `draft` vaut null tant que l'utilisateur n'a pas touché au
 *     sélecteur : la valeur affichée suit alors le panier (y compris
 *     après l'hydratation du localStorage, sans setState dans un effet —
 *     règle ESLint `react-hooks/set-state-in-effect`). Dès qu'il choisit
 *     un nombre, son choix prime jusqu'à validation.
 *   - Le composant ne fait QUE de l'UI ; toute la logique d'ajout est
 *     dans AddToCartButton (via useCart()).
 */

"use client";

import { useState } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { useCart } from "@/components/cart/CartProvider";
import QuantitySelector from "@/components/product/QuantitySelector";
import FavoriteToggleButton from "@/components/wishlist/FavoriteToggleButton";
import type { ProductItem } from "@/types/catalog";

type Props = {
  product: ProductItem;
};

export default function ProductBuyBox({ product }: Props) {
  const { lines } = useCart();
  const [draft, setDraft] = useState<number | null>(null);

  const inCartQty = product.productId
    ? (lines.find((l) => l.productId === product.productId)?.quantity ?? 0)
    : 0;

  // Sans choix de l'utilisateur, on affiche ce qui est au panier
  // (au moins 1, pour que le sélecteur reste utilisable).
  const quantity = draft ?? (inCartQty > 0 ? inCartQty : 1);

  return (
    <>
      {/* Quantité + Ajouter au panier */}
      <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
        <div>
          <label className="form-label fw-bold d-block">Quantité</label>
          <QuantitySelector value={quantity} onChange={setDraft} max={100} />
        </div>
        <div className="flex-grow-1">
          <AddToCartButton
            product={product}
            quantity={quantity}
            mode="set"
            onAdded={() => setDraft(null)}
          />
        </div>
      </div>

      {inCartQty > 0 && (
        <p className="text-secondary small mb-3">
          <i className="bi bi-cart-check me-1" aria-hidden="true"></i>
          Déjà dans votre panier : {inCartQty}. Le nombre choisi ci-dessus
          remplacera cette quantité.
        </p>
      )}

      {/* Acheter maintenant + Ajouter aux favoris */}
      <div className="d-grid gap-2 d-sm-flex mb-4">
        <div className="flex-fill">
          <AddToCartButton
            product={product}
            quantity={quantity}
            variant="buy-now"
            mode="set"
            onAdded={() => setDraft(null)}
          />
        </div>
        <FavoriteToggleButton
          productId={product.productId}
          className="btn btn-outline-dark flex-fill"
        />
      </div>
    </>
  );
}
