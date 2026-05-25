/**
 * Composant: OrderSummary (Client Component)
 *
 * Rôle du fichier :
 *   Récapitulatif des articles du panier dans la colonne droite de la
 *   page /checkout. Lit directement le panier via `useCart()` (plus de
 *   prop `items` — la source unique est le Provider).
 *
 * Où il est utilisé :
 *   - app/checkout/page.tsx
 *
 * Règles métier / sécurité :
 *   - Le sous-total est PUREMENT INDICATIF. Le backend recalculera tout
 *     lors du POST /api/orders (cf. CheckoutForm).
 *
 * Note pour GitHub Copilot :
 *   - Au premier rendu (SSR + hydratation), le panier est vide (snapshot
 *     serveur de CartProvider) ; les vraies lignes apparaissent juste
 *     après l'hydratation. Si le panier est réellement vide, on
 *     affiche un état neutre + un lien vers /panier.
 */

"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/checkout.module.css";

export default function OrderSummary() {
  const { lines, subtotalDisplay } = useCart();
  const currency = lines[0]?.currency ?? "GNF";

  if (lines.length === 0) {
    return (
      <aside className={styles.summaryCard}>
        <h2 className="h5 fw-bold mb-3">Résumé de commande</h2>
        <p className="text-secondary small mb-3">
          Votre panier est vide. Ajoutez des produits pour pouvoir commander.
        </p>
        <Link href="/panier" className="btn btn-outline-dark w-100">
          <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
          Retour au panier
        </Link>
      </aside>
    );
  }

  return (
    <aside className={styles.summaryCard}>
      <h2 className="h5 fw-bold mb-3">Résumé de commande</h2>

      <div className="mb-3">
        {lines.map((line) => (
          <div key={line.productId} className={styles.summaryItem}>
            <div className={styles.summaryItemIcon}>
              <i className={line.icon} aria-hidden="true"></i>
            </div>
            <div className="flex-grow-1">
              <div className={styles.summaryItemName}>{line.name}</div>
              <div className="text-secondary" style={{ fontSize: "0.78rem" }}>
                {line.vendor} · Qté {line.quantity}
              </div>
            </div>
            <div className={styles.summaryItemPrice}>
              {formatPrice(line.price * line.quantity, line.currency)}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summaryLine}>
        <span>Sous-total</span>
        <strong>{formatPrice(subtotalDisplay, currency)}</strong>
      </div>
      <div className={styles.summaryLine}>
        <span>Livraison</span>
        <strong>À confirmer</strong>
      </div>
      <div className={styles.summaryLine}>
        <span>Remise</span>
        <strong>{formatPrice(0, currency)}</strong>
      </div>

      <div className={styles.summaryTotal}>
        <span className={styles.summaryTotalLabel}>Total estimé</span>
        <strong className={styles.summaryTotalValue}>
          {formatPrice(subtotalDisplay, currency)}
        </strong>
      </div>

      <p className="small text-secondary mt-3 mb-0">
        Le total final (incluant les frais de livraison éventuels) est calculé
        par le vendeur lors de la confirmation.
      </p>
    </aside>
  );
}
