/**
 * Composant: CartView (Client Component)
 *
 * Rôle du fichier :
 *   Affichage interactif du panier sur la page /panier. Consomme
 *   `useCart()` pour lire les lignes, les modifier (quantité, retrait,
 *   vidage) et calculer le sous-total d'affichage. Gère deux états :
 *     - panier vide  -> grand encart « explorer la boutique » ;
 *     - panier rempli -> liste d'articles + carte récapitulative.
 *
 * Où il est utilisé :
 *   - app/panier/page.tsx (le reste de la page — hero, services,
 *     newsletter — reste Server Component).
 *
 * Règles métier / sécurité :
 *   - Le sous-total affiché est PUREMENT INDICATIF. Le backend
 *     recalculera le total à la création de commande (POST /api/orders).
 *   - Le bouton « Passer à la caisse » mène vers /checkout (l'ancien
 *     lien pointait par erreur vers /boutique).
 *
 * Note pour GitHub Copilot :
 *   - Lors du tout premier rendu (SSR + 1re hydratation), `lines` est
 *     vide (snapshot serveur de CartProvider). Après l'hydratation
 *     locale via useSyncExternalStore, les lignes réelles apparaissent.
 *     Bref flash possible « panier vide » -> « panier rempli » au reload
 *     — acceptable pour le MVP, à raffiner plus tard via un indicateur
 *     d'hydratation dédié si nécessaire.
 */

"use client";

import Link from "next/link";
import CartItem from "@/components/cart/CartItem";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/cart.module.css";

export default function CartView() {
  const { lines, subtotalDisplay, clearCart } = useCart();
  const currency = lines[0]?.currency ?? "GNF";
  const hasItems = lines.length > 0;

  if (!hasItems) {
    return (
      <section className={styles.cartPage}>
        <div className="container">
          <div className={styles.emptyCartBox}>
            <div className={styles.emptyCartIcon}>
              <i className="bi bi-bag" aria-hidden="true"></i>
            </div>
            <h2 className="h4 fw-bold">Votre panier est vide</h2>
            <p className="text-secondary mb-3">
              Découvrez nos catégories et ajoutez vos produits préférés
              auprès des vendeurs locaux de Sangarédi.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Link href="/boutique" className="btn btn-warning fw-bold">
                <i className="bi bi-bag me-1" aria-hidden="true"></i>
                Voir la boutique
              </Link>
              <Link href="/categories" className="btn btn-outline-dark">
                Explorer les catégories
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.cartPage}>
      <div className="container">
        <div className="row g-4 align-items-start">
          {/* Colonne gauche : liste des articles */}
          <div className="col-lg-8">
            <div className={styles.cartCard}>
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-2">
                <div>
                  <span className="fw-bold" style={{ color: "var(--mf-orange)" }}>
                    Articles sélectionnés
                  </span>
                  <h2 className="h3 fw-bold mb-0">
                    {lines.length} produit{lines.length > 1 ? "s" : ""} dans votre panier
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none fw-bold align-self-md-end"
                  style={{ color: "var(--mf-orange)" }}
                  onClick={() => clearCart()}
                >
                  <i className="bi bi-trash me-1" aria-hidden="true"></i>
                  Vider le panier
                </button>
              </div>

              {lines.map((line) => (
                <CartItem key={line.productId} line={line} />
              ))}
            </div>

            {/* Suggestion (upsell, non lié au panier) */}
            <div className={`${styles.emptyCartBox} mt-4`}>
              <div className={styles.emptyCartIcon}>
                <i className="bi bi-bag-plus" aria-hidden="true"></i>
              </div>
              <h2 className="h4 fw-bold">Envie d&apos;ajouter d&apos;autres produits ?</h2>
              <p className="text-secondary mb-3">
                Explorez les catégories populaires et trouvez d&apos;autres
                bonnes affaires locales.
              </p>
              <Link href="/categories" className="btn btn-outline-dark">
                Explorer les catégories
              </Link>
            </div>
          </div>

          {/* Colonne droite : récapitulatif */}
          <div className="col-lg-4">
            <aside className={styles.summaryCard}>
              <h2 className="h4 fw-bold mb-3">Résumé de commande</h2>

              <div className={styles.summaryLine}>
                <span>Sous-total</span>
                <strong>{formatPrice(subtotalDisplay, currency)}</strong>
              </div>
              <div className={styles.summaryLine}>
                <span>Livraison estimée</span>
                <strong>À confirmer</strong>
              </div>
              <div className={styles.summaryLine}>
                <span>Remise</span>
                <strong>{formatPrice(0, currency)}</strong>
              </div>

              <div className={styles.summaryTotal}>
                <span className={styles.summaryTotalLabel}>Total</span>
                <strong className={styles.summaryTotalValue}>
                  {formatPrice(subtotalDisplay, currency)}
                </strong>
              </div>

              {/* Lien corrigé : pointait par erreur vers /boutique. */}
              <Link href="/checkout" className="btn btn-warning fw-bold w-100 mt-4">
                Passer à la caisse{" "}
                <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
              </Link>

              <Link href="/boutique" className="btn btn-outline-dark w-100 mt-2">
                Continuer mes achats
              </Link>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex gap-2 mb-2">
                  <i className="bi bi-shield-check text-success" aria-hidden="true"></i>
                  <span className="small text-secondary fw-semibold">
                    Vendeurs locaux identifiés
                  </span>
                </div>
                <div className="d-flex gap-2 mb-2">
                  <i
                    className="bi bi-truck"
                    aria-hidden="true"
                    style={{ color: "var(--mf-orange)" }}
                  ></i>
                  <span className="small text-secondary fw-semibold">
                    Livraison locale selon disponibilité
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <i className="bi bi-headset text-primary" aria-hidden="true"></i>
                  <span className="small text-secondary fw-semibold">
                    Support Marché Fooly
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
