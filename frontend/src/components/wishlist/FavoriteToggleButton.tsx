"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  productId?: string;
  className?: string;
};

export default function FavoriteToggleButton({ productId, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!productId || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        router.push(`/mon-compte?retour=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError("Impossible d’ajouter ce favori. Réessayez.");
      }
    } catch {
      setError("Connexion interrompue. Réessayez pour ajouter ce favori.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <button
      type="button"
      className={className ?? "btn btn-outline-dark"}
      onClick={handleAdd}
      disabled={!productId || loading || saved}
    >
      <i
        className={`bi ${saved ? "bi-heart-fill" : "bi-heart"} me-1`}
        aria-hidden="true"
      ></i>
      {loading ? "Ajout..." : saved ? "Dans mes favoris" : "Ajouter aux favoris"}
    </button>
    {error && <p className="text-danger small mb-0" role="alert">{error}</p>}
    </>
  );
}
