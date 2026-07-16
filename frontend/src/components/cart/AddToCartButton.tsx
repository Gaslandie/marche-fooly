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
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import type { ProductItem } from "@/types/catalog";

type Variant = "default" | "buy-now";

type Props = {
  product: ProductItem;
  quantity?: number;
  variant?: Variant;
  className?: string;
};

type Feedback = { kind: "success" | "error"; message: string };

const SUCCESS_RESET_MS = 3000;

export default function AddToCartButton({
  product,
  quantity = 1,
  variant = "default",
  className,
}: Props) {
  const { addItem, replaceCartWith, lines } = useCart();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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

  const label = !canAdd
    ? product.inStock
      ? "Indisponible"
      : "Rupture de stock"
    : isBuyNow
      ? "Acheter maintenant"
      : "Ajouter au panier";

  const icon = isBuyNow ? "bi bi-bag-check me-1" : "bi bi-cart-plus me-1";

  function showFeedback(kind: Feedback["kind"], message: string) {
    setFeedback({ kind, message });
    if (kind === "success") {
      window.setTimeout(() => setFeedback(null), SUCCESS_RESET_MS);
    }
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

    showFeedback("success", `${product.name} ajouté au panier.`);
    if (isBuyNow) router.push("/panier");
  }

  return (
    <div className="d-flex flex-column gap-2">
      <button
        type="button"
        className={baseClass}
        onClick={handleClick}
        disabled={!canAdd}
        aria-label={`${label} : ${product.name}`}
      >
        <i className={icon} aria-hidden="true"></i>
        {label}
      </button>
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
          maintenant ») pour éviter un doublon sur la fiche produit. */}
      {!isBuyNow && inCartQty > 0 && (
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
