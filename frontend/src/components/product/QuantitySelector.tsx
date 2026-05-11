"use client";

import { useState } from "react";
import styles from "@/styles/quantitySelector.module.css";

type Props = {
  initial?: number;
  min?: number;
  max?: number;
};

export default function QuantitySelector({ initial = 1, min = 1, max = 99 }: Props) {
  const [qty, setQty] = useState(initial);

  return (
    <div className={styles.quantityBox}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => setQty((q) => Math.max(min, q - 1))}
        aria-label="Diminuer la quantité"
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
        onClick={() => setQty((q) => Math.min(max, q + 1))}
        aria-label="Augmenter la quantité"
      >
        +
      </button>
    </div>
  );
}
