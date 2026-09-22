/**
 * Composant: AddToCartButton (Client Component)
 *
 * Rôle du fichier :
 *   Bouton « Ajouter au panier » / « Acheter maintenant ». Utilise
 *   `useCart()` pour ajouter le produit au panier client. Gère le
 *   conflit mono-vendeur en demandant confirmation à l'utilisateur
 *   (vider le panier précédent), conformément à la règle métier (le
 *   backend refuse les paniers multi-vendeurs).
 *
 * Où il est utilisé :
 *   - components/product/ProductBuyBox.tsx (page produit)
 *   - Peut être réutilisé sur une vignette de catalogue plus tard.
 *
 * Règles métier / sécurité :
 *   - N'envoie aucun prix au backend (l'ajout reste local).
 *   - Désactivé tant que `productId` ou `sellerSlug` du produit ne sont
 *     pas renseignés (cas des données statiques de dev) — on n'ajoute
 *     pas un produit qu'on ne pourrait pas commander.
 *   - Désactivé si rupture de stock (`inStock === false`).
 *
 * Note pour GitHub Copilot :
 *   - `variant="buy-now"` ajoute au panier ET redirige vers /panier.
 *   - `quantity` est passée par le parent (ProductBuyBox la synchronise
 *     avec QuantitySelector). Par défaut 1.
 *   - Après un ajout réussi, le bouton lui-même affiche « Ajouté » en vert
 *     (retour visuel demandé par la cliente) — plus d'alerte verte séparée
 *     pour ce cas ; les alertes restent pour les erreurs et le conflit
 *     mono-vendeur.
 *   - `quantityControls` (cartes produit) : quand le produit est déjà au
 *     panier, le bouton laisse place à un compteur −/+ branché sur
 *     updateQuantity ; à 0, l'article est retiré et le bouton revient.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import QuantitySelector from "@/components/product/QuantitySelector";
import type { ProductItem } from "@/types/catalog";

type Variant = "default" | "buy-now";

type Props = {
  product: ProductItem;
  quantity?: number;
  variant?: Variant;
  className?: string;
  /** Affiche un compteur −/+ sur place quand le produit est déjà au panier. */
  quantityControls?: boolean;
};

type Feedback = { kind: "success" | "error"; message: string };

const SUCCESS_RESET_MS = 3000;
/** Durée d'affichage de l'état « Ajouté » sur le bouton après un ajout. */
const ADDED_RESET_MS = 1600;

export default function AddToCartButton({
  product,
  quantity = 1,
  variant = "default",
  className,
  quantityControls = false,
}: Props) {
  const { addItem, replaceCartWith, updateQuantity, lines } = useCart();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const canAdd = !!product.productId && !!product.sellerSlug && product.inStock;
  const isBuyNow = variant === "buy-now";

  // Quantité de CE produit déjà présente dans le panier (indication
  // persistante : reste affichée tant que le produit est au panier, même
  // après disparition du message de confirmation temporaire).
  const inCartQty = product.productId
    ? lines.find((l) => l.productId === product.productId)?.quantity ?? 0
    : 0;

  const baseClass =
    className ??
    (isBuyNow
      ? "btn btn-dark fw-bold w-100"
      : "btn btn-warning fw-bold w-100");

  // État « Ajouté » : même bouton, couleur succès (on garde la taille
  // venant de className — ex. btn-sm sur les cartes).
  const addedClass = baseClass.replace(/btn-(warning|dark)\b/, "btn-success");

  const label = !canAdd
    ? product.inStock
      ? "Indisponible"
      : "Rupture de stock"
    : justAdded
      ? "Ajouté"
      : isBuyNow
        ? "Acheter maintenant"
        : "Ajouter au panier";

  const icon = justAdded
    ? "bi bi-check-lg me-1"
    : isBuyNow
      ? "bi bi-bag-check me-1"
      : "bi bi-cart-plus me-1";

  function showFeedback(kind: Feedback["kind"], message: string) {
    setFeedback({ kind, message });
    if (kind === "success") {
      window.setTimeout(() => setFeedback(null), SUCCESS_RESET_MS);
    }
  }

  /** Fait passer le bouton en « Ajouté » (vert) pendant un court instant. */
  function markAdded() {
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), ADDED_RESET_MS);
  }

  function handleClick() {
    if (!canAdd) return;

    const input = {
      productId: product.productId as string,
      productSlug: product.slug,
      sellerSlug: product.sellerSlug as string,
      name: product.name,
      vendor: product.vendor,
      icon: product.icon,
      price: product.price,
      currency: product.currency,
      quantity,
    };

    const result = addItem(input);

    if (!result.ok && result.reason === "seller-conflict") {
      const confirmed = window.confirm(
        `Votre panier contient déjà des produits du vendeur « ${result.currentSeller} ».\n\n` +
          `Voulez-vous vider votre panier pour acheter chez « ${result.newSeller} » ?`,
      );
      if (confirmed) {
        replaceCartWith(input);
        markAdded();
        // Alerte conservée ici : le remplacement du panier est une info
        // importante que le seul état « Ajouté » ne raconte pas.
        showFeedback(
          "success",
          `${product.name} ajouté · panier précédent remplacé.`,
        );
        if (isBuyNow) router.push("/panier");
      } else {
        showFeedback("error", "Ajout annulé. Panier précédent conservé.");
      }
      return;
    }

    if (!result.ok && result.reason === "max-lines") {
      showFeedback("error", "Votre panier est plein (50 produits maximum).");
      return;
    }

    // Ajout simple : le retour visuel est porté par le bouton lui-même
    // (« Ajouté » en vert), pas par une alerte.
    markAdded();
    if (isBuyNow) router.push("/panier");
  }

  // Compteur −/+ à la place du bouton : uniquement en mode
  // quantityControls, quand le produit est déjà au panier et hors du
  // court instant « Ajouté » (le temps que l'utilisateur voie le retour).
  const showStepper = quantityControls && !justAdded && inCartQty > 0;

  return (
    <div className="d-flex flex-column gap-2">
      {showStepper ? (
        <div className="d-flex align-items-center flex-wrap gap-2">
          <QuantitySelector
            compact
            value={inCartQty}
            min={0}
            max={99}
            onChange={(next) =>
              updateQuantity(product.productId as string, next)
            }
          />
          <span className="small fw-semibold text-success">
            <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
            Dans le panier
          </span>
        </div>
      ) : (
        <button
          type="button"
          className={justAdded ? addedClass : baseClass}
          onClick={handleClick}
          disabled={!canAdd}
          aria-label={`${label} : ${product.name}`}
        >
          <i className={icon} aria-hidden="true"></i>
          {label}
        </button>
      )}
      {feedback && (
        <div
          className={`alert ${
            feedback.kind === "success" ? "alert-success" : "alert-warning"
          } py-2 px-3 small mb-0`}
          role={feedback.kind === "success" ? "status" : "alert"}
        >
          {feedback.message}
        </div>
      )}
      {/* Indication persistante : ce produit est déjà dans le panier.
          Affichée uniquement sur le bouton principal (pas sur « Acheter
          maintenant »), et pas en mode quantityControls (le compteur −/+
          porte déjà cette information). */}
      {!isBuyNow && !quantityControls && inCartQty > 0 && (
        <Link
          href="/panier"
          className="d-inline-flex align-items-center gap-1 small fw-semibold text-success text-decoration-none"
        >
          <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
          Dans le panier · {inCartQty}
        </Link>
      )}
    </div>
  );
}
