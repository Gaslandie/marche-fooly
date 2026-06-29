"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId?: string;
  className: string;
};

export default function RemoveFavoriteButton({ productId, className }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!productId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.push("/mon-compte");
        return;
      }
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleRemove}
      disabled={!productId || loading}
      aria-label="Retirer des favoris"
    >
      <i
        className={loading ? "bi bi-hourglass-split" : "bi bi-x-lg"}
        aria-hidden="true"
      ></i>
    </button>
  );
}
