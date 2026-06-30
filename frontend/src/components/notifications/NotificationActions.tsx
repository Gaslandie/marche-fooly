"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NotificationActionsProps = {
  id?: string;
  mode: "single" | "all";
  disabled?: boolean;
};

export default function NotificationActions({
  id,
  mode,
  disabled = false,
}: NotificationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading || disabled) return;
    setLoading(true);

    const endpoint =
      mode === "all"
        ? "/api/notifications/read-all"
        : `/api/notifications/${encodeURIComponent(id || "")}/read`;

    try {
      const res = await fetch(endpoint, { method: "PATCH" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={mode === "all" ? "btn btn-dark btn-sm" : "btn btn-outline-dark btn-sm"}
      onClick={handleClick}
      disabled={disabled || loading || (mode === "single" && !id)}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Mise à jour…
        </>
      ) : mode === "all" ? (
        "Tout marquer comme lu"
      ) : (
        "Marquer comme lu"
      )}
    </button>
  );
}

