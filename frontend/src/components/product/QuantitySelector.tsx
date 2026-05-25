/**
 * Composant: QuantitySelector (Client Component)
 *
 * Rôle du fichier :
 *   Sélecteur de quantité (−/+/affichage). Supporte les deux modes :
 *     - CONTRÔLÉ : le parent passe `value` ET `onChange` (recommandé
 *       dès qu'une autre partie de l'UI doit lire la quantité — ex.
 *       ProductBuyBox -> AddToCartButton).
 *     - NON CONTRÔLÉ : on n'utilise que `initial` (compat ascendante
 *       avec les usages existants, ex. CartItem qui n'est pas encore
 *       branché au panier réel — Bloc 4).
 *
 * Où il est utilisé :
 *   - components/product/ProductBuyBox.tsx (contrôlé)
 *   - components/cart/CartItem.tsx (non contrôlé pour l'instant)
 *
 * Règles métier :
 *   - La quantité reste bornée à [min, max] (par défaut [1, 99]).
 *   - Le composant n'envoie rien au serveur ; il pilote juste un nombre.
 *
 * Note pour GitHub Copilot :
 *   - Mode contrôlé = présence simultanée de `value` ET `onChange`.
 *   - Sinon mode non contrôlé (state interne via useState).
 *   - Aucune mise à jour silencieuse de `value` : le parent en garde
 *     le contrôle exclusif.
 */

"use client";

import { useState } from "react";
import styles from "@/styles/quantitySelector.module.css";

type Props = {
  initial?: number;
  min?: number;
  max?: number;
  value?: number;
  onChange?: (next: number) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function QuantitySelector({
  initial = 1,
  min = 1,
  max = 99,
  value,
  onChange,
}: Props) {
  const isControlled = value !== undefined && onChange !== undefined;
  const [internal, setInternal] = useState(initial);
  const qty = isControlled ? (value as number) : internal;

  function setQty(next: number) {
    const clamped = clamp(next, min, max);
    if (isControlled) {
      onChange!(clamped);
    } else {
      setInternal(clamped);
    }
  }

  return (
    <div className={styles.quantityBox}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => setQty(qty - 1)}
        aria-label="Diminuer la quantité"
        disabled={qty <= min}
      >
        −
      </button>
      <input
        type="text"
        className={styles.qty}
        value={qty}
        readOnly
        aria-label="Quantité sélectionnée"
      />
      <button
        type="button"
        className={styles.btn}
        onClick={() => setQty(qty + 1)}
        aria-label="Augmenter la quantité"
        disabled={qty >= max}
      >
        +
      </button>
    </div>
  );
}
