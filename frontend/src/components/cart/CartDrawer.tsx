/**
 * Composant: CartDrawer (Client Component)
 *
 * Rôle du fichier :
 *   Panneau panier latéral qui glisse depuis la droite dès qu'un produit
 *   est ajouté au panier (demande cliente/propriétaire du 22/09/2026 :
 *   « que ça nous ouvre un menu latéral pour ajouter le produit, choisir
 *   le nombre et tout »). L'utilisateur y voit ce qu'il vient d'ajouter,
 *   ajuste les quantités, et repart vers le panier ou la commande sans
 *   quitter la page où il naviguait.
 *
 * Où il est utilisé :
 *   - CartProvider, chargé à la demande à la première ouverture.
 *
 * Règles techniques :
 *   - Ouverture pilotée par `drawerOpen` du CartProvider (état d'interface).
 *   - Le contenu n'est monté QUE lorsque le panneau est ouvert : pas de
 *     setState dans un effet (règle ESLint `react-hooks/set-state-in-effect`),
 *     et rien dans le DOM le reste du temps.
 *   - createPortal(document.body) : aucun ancêtre ne peut casser le
 *     positionnement fixe.
 *   - Bootstrap est chargé en CSS seulement : le panneau est du CSS module
 *     maison, sans dépendance au JS Bootstrap (offcanvas).
 *
 * Accessibilité :
 *   - role="dialog" + aria-modal + aria-labelledby ;
 *   - Échap ferme, clic sur le fond ferme, focus initial sur « Fermer » ;
 *   - scroll de la page gelé tant que le panneau est ouvert.
 */

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCart } from "@/components/cart/CartProvider";
import QuantitySelector from "@/components/product/QuantitySelector";
import ProductImage from "@/components/product/ProductImage";
import type { CartLine } from "@/types/cart";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/cartDrawer.module.css";

export default function CartDrawer() {
  const { drawerOpen, closeDrawer } = useCart();
  if (!drawerOpen) return null;
  return <DrawerContent onClose={closeDrawer} />;
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  const { lines, totalQuantity, subtotalDisplay, updateQuantity, removeItem } =
    useCart();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    // inert retire le fond du clavier et de l'arbre des lecteurs d'écran.
    const background = Array.from(document.body.children)
      .filter((node): node is HTMLElement => node instanceof HTMLElement && node.getAttribute("aria-hidden") !== "true" && !node.contains(drawerRef.current))
      .map((node) => ({ node, wasInert: node.inert }));
    background.forEach(({ node }) => { node.inert = true; });
    const keepFocusInside = () => {
      if (!drawerRef.current?.contains(document.activeElement)) closeButtonRef.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "Tab") {
        const elements = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ) ?? []).filter((element) => element.getClientRects().length > 0);
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (first && (!drawerRef.current?.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last))) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", keepFocusInside);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", keepFocusInside);
      background.forEach(({ node, wasInert }) => { node.inert = wasInert; });
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  const currency = lines[0]?.currency ?? "GNF";
  const isEmpty = lines.length === 0;

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true"></div>
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div className={styles.header}>
          <i
            className="bi bi-cart3"
            style={{ fontSize: "1.25rem", color: "var(--mf-orange)" }}
            aria-hidden="true"
          ></i>
          <h2 className={styles.title} id="cart-drawer-title">
            Mon panier
            {totalQuantity > 0 && (
              <span className="text-secondary fw-normal">
                {" "}
                · {totalQuantity} article{totalQuantity > 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={onClose}
            aria-label="Fermer le panier"
            ref={closeButtonRef}
          ></button>
        </div>

        <div className={styles.body}>
          {isEmpty ? (
            <p className="text-secondary mb-0">
              Votre panier est vide pour le moment.
            </p>
          ) : (
            lines.map((line) => (
              <DrawerLine
                key={line.productId}
                line={line}
                onQuantityChange={(qty) => { if (qty === 0) closeButtonRef.current?.focus(); updateQuantity(line.productId, qty); }}
                onRemove={() => { closeButtonRef.current?.focus(); removeItem(line.productId); }}
                onNavigate={onClose}
              />
            ))
          )}
        </div>

        <div className={styles.footer}>
          {!isEmpty && (
            <>
              <div className={styles.subtotalRow}>
                <span className="fw-semibold">Sous-total</span>
                <span className={styles.subtotalValue}>
                  {formatPrice(subtotalDisplay, currency)}
                </span>
              </div>
              <p className="text-secondary small mb-3">
                Livraison calculée à l&apos;étape suivante.
              </p>
            </>
          )}

          <div className="d-grid gap-2">
            {!isEmpty && (
              <>
                <Link
                  href="/checkout"
                  className="btn btn-warning fw-bold"
                  onClick={onClose}
                >
                  <i className="bi bi-bag-check me-1" aria-hidden="true"></i>
                  Passer commande
                </Link>
                <Link
                  href="/panier"
                  className="btn btn-outline-dark"
                  onClick={onClose}
                >
                  Voir le panier
                </Link>
              </>
            )}
            <button type="button" className="btn btn-link" onClick={onClose}>
              {isEmpty ? "Fermer le panier" : "Continuer mes achats"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function DrawerLine({
  line,
  onQuantityChange,
  onRemove,
  onNavigate,
}: {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className={styles.line}>
      <div className={styles.lineMedia}>
        {line.imageUrl ? (
          <ProductImage src={line.imageUrl} alt="" className={styles.lineImage} width={56} height={56} />
        ) : (
          <i className={line.icon} aria-hidden="true"></i>
        )}
      </div>

      <div>
        <h3 className={styles.lineName}>
          <Link href={`/produit/${encodeURIComponent(line.productSlug)}`} onClick={onNavigate}>
            {line.name}
          </Link>
        </h3>
        <p className={styles.lineVendor}>Vendeur : {line.vendor}</p>

        <div className={styles.lineFooter}>
          {/* À 0, la ligne est retirée du panier (updateQuantity). */}
          <QuantitySelector
            compact
            value={line.quantity}
            min={0}
            max={100}
            onChange={onQuantityChange}
          />
          <span className={styles.linePrice}>
            {formatPrice(line.price * line.quantity, line.currency)}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-link btn-sm p-0 mt-2 text-danger text-decoration-none"
          onClick={onRemove}
          aria-label={`Retirer ${line.name} du panier`}
        >
          <i className="bi bi-trash me-1" aria-hidden="true"></i>
          Retirer
        </button>
      </div>
    </div>
  );
}
