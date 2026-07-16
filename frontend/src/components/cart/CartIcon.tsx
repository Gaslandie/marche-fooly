/**
 * Composant: CartIcon (Client Component)
 *
 * Rôle du fichier :
 *   Icône panier de la barre de navigation, avec une pastille de comptage
 *   (le nombre total d'articles du panier). Le comptage vit côté client
 *   (localStorage via useCart()), c'est pourquoi ce petit bloc doit être un
 *   Client Component isolé — le Header, lui, reste un Server Component.
 *
 * Où il est utilisé :
 *   - components/layout/Header.tsx (remplace l'ancien lien statique panier).
 *
 * Note pour GitHub Copilot :
 *   - `totalQuantity` vient de useCart() (source de vérité: CartProvider).
 *   - Sur le rendu serveur, le panier est vide (getServerSnapshot), donc
 *     aucune pastille n'est rendue ; elle apparaît juste après l'hydratation.
 *     useSyncExternalStore gère cette transition sans warning d'hydratation.
 */

"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export default function CartIcon() {
  const { totalQuantity } = useCart();
  const hasItems = totalQuantity > 0;

  return (
    <Link
      href="/panier"
      className="mf-icon-link"
      aria-label={
        hasItems
          ? `Panier : ${totalQuantity} article${totalQuantity > 1 ? "s" : ""}`
          : "Panier"
      }
    >
      <i className="bi bi-cart3" aria-hidden="true"></i>
      {hasItems && (
        <span className="mf-icon-badge">
          {totalQuantity > 99 ? "99+" : totalQuantity}
        </span>
      )}
    </Link>
  );
}
