/**
 * Composant: CartItem (Client Component)
 *
 * Rôle du fichier :
 *   Ligne de panier dans la page /panier. Branché au state via
 *   `useCart()` :
 *     - QuantitySelector contrôlé -> updateQuantity()
 *     - Bouton « Retirer »        -> removeItem()
 *
 * Où il est utilisé :
 *   - components/cart/CartView.tsx
 *
 * Note pour GitHub Copilot :
 *   - Le type `CartItemData` reste EXPORTÉ pour compatibilité avec
 *     l'ancien checkout et OrderSummary (qui en ont besoin pour leur
 *     props historique). À retirer quand ces consommateurs auront été
 *     migrés vers CartLine (bloc Checkout suivant).
 *   - Le composant ne calcule plus aucun total à part le sous-total
 *     d'AFFICHAGE de la ligne (price × quantity). Le backend reste la
 *     source de vérité au moment du POST /api/orders.
 */

"use client";

import Link from "next/link";
import QuantitySelector from "@/components/product/QuantitySelector";
import { useCart } from "@/components/cart/CartProvider";
import type { CartLine } from "@/types/cart";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/cart.module.css";

/** Conservé pour rétrocompatibilité (OrderSummary, checkout/page.tsx). */
export type CartItemData = {
  slug: string;
  name: string;
  icon: string;
  vendor: string;
  meta: string;
  price: number;
  currency: string;
  quantity: number;
};

type Props = {
  line: CartLine;
};

export default function CartItem({ line }: Props) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className={styles.cartProduct}>
      <div className={styles.cartProductImg}>
        <i className={line.icon} aria-hidden="true"></i>
      </div>

      <div>
        <h2 className={styles.cartProductTitle}>
          <Link href={`/produit/${line.productSlug}`}>{line.name}</Link>
        </h2>
        <div className={styles.cartProductMeta}>Vendeur : {line.vendor}</div>
        <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
          <span className="badge rounded-pill bg-success">En stock</span>
          <button
            type="button"
            className={`${styles.removeLink} btn btn-link p-0`}
            onClick={() => removeItem(line.productId)}
          >
            <i className="bi bi-trash me-1" aria-hidden="true"></i>Retirer
          </button>
        </div>
      </div>

      <div className={styles.cartProductActions}>
        <div className="mb-2">
          <QuantitySelector
            value={line.quantity}
            onChange={(qty) => updateQuantity(line.productId, qty)}
            max={100}
          />
        </div>
        <div className={styles.cartProductPrice}>
          {formatPrice(line.price * line.quantity, line.currency)}
        </div>
      </div>
    </div>
  );
}
