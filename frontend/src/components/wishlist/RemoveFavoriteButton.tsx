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
  const [error, setError] = useState("");

  async function handleRemove() {
    if (!productId || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/favorites/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.push("/mon-compte?retour=/favoris");
        return;
      }
      if (res.ok) router.refresh();
      else setError("Impossible de retirer ce favori. Réessayez.");
    } catch {
      setError("Connexion interrompue. Réessayez pour retirer ce favori.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
    {error && <p className="alert alert-danger m-2 position-absolute bottom-0 start-0 end-0" style={{ fontSize: "0.875rem", zIndex: 2 }} role="alert">{error}</p>}
    </>
  );
}
