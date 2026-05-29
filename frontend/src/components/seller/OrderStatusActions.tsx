/**
 * Composant: OrderStatusActions (Client Component)
 *
 * Rôle du fichier :
 *   Boutons de changement de statut d'une commande, côté vendeur.
 *   N'affiche QUE les transitions autorisées par getSellerStatusTransitions
 *   (miroir de la machine d'état backend). Appelle le Route Handler BFF
 *   PATCH /api/orders/[reference]/status puis rafraîchit la page.
 *
 * Où il est utilisé :
 *   - app/vendeur/commandes/[reference]/page.tsx
 *
 * Règles de sécurité / métier :
 *   - Aucun JWT manipulé (cookie httpOnly lu côté serveur par le Route
 *     Handler).
 *   - Le backend reste la SOURCE DE VÉRITÉ : il revérifie l'ownership et
 *     la transition. On masque juste les transitions interdites (UX) et
 *     on relaie ses erreurs (422/403/404/409).
 *   - L'annulation demande une confirmation explicite (le backend
 *     restaure le stock).
 *   - 409 (conflit de version) -> message dédié + router.refresh().
 *
 * Note pour GitHub Copilot :
 *   - Après succès : router.refresh() ; la page serveur re-render avec le
 *     nouveau statut, donc les transitions proposées se mettent à jour.
 *   - États terminaux (delivered/cancelled) -> aucune action.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSellerStatusTransitions,
  type SellerStatusTransition,
} from "@/lib/orderStatus";

type Props = {
  reference: string;
  status: string;
};

type Feedback = { kind: "success" | "error"; message: string };

export default function OrderStatusActions({ reference, status }: Props) {
  const router = useRouter();
  const transitions = getSellerStatusTransitions(status);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (transitions.length === 0) {
    return (
      <p className="text-secondary small mb-0">
        <i className="bi bi-check2-circle me-1" aria-hidden="true"></i>
        Aucune action disponible pour ce statut.
      </p>
    );
  }

  async function applyTransition(transition: SellerStatusTransition) {
    if (transition.intent === "cancel") {
      const confirmed = window.confirm(
        "Annuler cette commande ?\n\nLe stock des articles sera restauré. Cette action est définitive.",
      );
      if (!confirmed) return;
    }

    setPendingTarget(transition.target);
    setFeedback(null);

    let httpStatus = 0;
    let body: { success?: boolean; message?: string } | null = null;
    try {
      const res = await fetch(`/api/orders/${reference}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: transition.target }),
      });
      httpStatus = res.status;
      body = await res.json();
    } catch {
      setPendingTarget(null);
      setFeedback({
        kind: "error",
        message: "Service indisponible. Vérifiez votre connexion et réessayez.",
      });
      return;
    }

    if (!body?.success) {
      setPendingTarget(null);
      if (httpStatus === 409) {
        setFeedback({
          kind: "error",
          message:
            "Cette commande a été modifiée entre-temps. Rechargez puis réessayez.",
        });
        router.refresh();
        return;
      }
      setFeedback({
        kind: "error",
        message: body?.message ?? "Changement de statut impossible.",
      });
      return;
    }

    setFeedback({ kind: "success", message: body?.message ?? "Statut mis à jour." });
    setPendingTarget(null);
    router.refresh();
  }

  const busy = pendingTarget !== null;

  return (
    <div>
      <div className="d-flex flex-wrap gap-2">
        {transitions.map((transition) => {
          const isPending = pendingTarget === transition.target;
          const className =
            transition.intent === "cancel"
              ? "btn btn-outline-danger"
              : "btn btn-warning fw-bold";
          return (
            <button
              key={transition.target}
              type="button"
              className={className}
              onClick={() => applyTransition(transition)}
              disabled={busy}
            >
              {isPending ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Traitement…
                </>
              ) : (
                transition.label
              )}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`alert ${
            feedback.kind === "success" ? "alert-success" : "alert-danger"
          } py-2 px-3 small mt-3 mb-0`}
          role={feedback.kind === "success" ? "status" : "alert"}
        >
          <i
            className={`bi ${
              feedback.kind === "success"
                ? "bi-check-circle"
                : "bi-exclamation-triangle"
            } me-1`}
            aria-hidden="true"
          ></i>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
