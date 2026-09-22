/**
 * Composant: CancelOrderButton (Client Component)
 *
 * Rôle du fichier :
 *   Bouton « Annuler la commande » côté ACHETEUR. Affiché uniquement pour
 *   les statuts encore annulables (isCustomerCancellable — décision
 *   cliente du 22/09/2026 : annulable tant que pas livrée). Demande une
 *   confirmation explicite via ConfirmDialog (dialogue dans la page, pas
 *   window.confirm) puis appelle le Route Handler BFF
 *   PATCH /api/orders/[reference]/status avec { status: "cancelled" }.
 *
 * Où il est utilisé :
 *   - components/orders/OrderCard.tsx (liste « Mes commandes »)
 *   - app/commande/[reference]/page.tsx (détail commande)
 *
 * Règles de sécurité / métier :
 *   - Aucun JWT manipulé (cookie httpOnly lu côté serveur par le Route
 *     Handler). Le backend revérifie l'ownership ET la transition : on
 *     masque juste le bouton quand le statut ne le permet plus (UX) et on
 *     relaie ses erreurs (422/403/404/409).
 *   - L'annulation restaure le stock côté backend et notifie le vendeur
 *     (notifyOrderStatusChanged) — rien à faire ici.
 *   - 409 (conflit de version) -> message dédié + router.refresh().
 *
 * Note pour GitHub Copilot :
 *   - Après succès : router.refresh() ; les pages serveur re-rendent avec
 *     le nouveau statut (badge « Annulée », timeline, bouton masqué).
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { isCustomerCancellable } from "@/lib/orderStatus";

type Props = {
  reference: string;
  status: string;
  /** Classes du bouton (défaut : outline danger pleine largeur du bloc). */
  className?: string;
};

type Feedback = { kind: "success" | "error"; message: string };

export default function CancelOrderButton({
  reference,
  status,
  className = "btn btn-outline-danger",
}: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (!isCustomerCancellable(status)) return null;

  /**
   * Lancé APRÈS confirmation dans le dialogue. Le motif est facultatif
   * côté acheteur (obligatoire seulement pour le vendeur, côté backend),
   * mais il aide le vendeur à comprendre et à s'organiser.
   */
  async function cancelOrder(reason: string) {
    setConfirmOpen(false);
    setSubmitting(true);
    setFeedback(null);

    let httpStatus = 0;
    let body: { success?: boolean; message?: string } | null = null;
    try {
      const res = await fetch(`/api/orders/${reference}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancellationReason: reason }),
      });
      httpStatus = res.status;
      body = await res.json();
    } catch {
      setSubmitting(false);
      setFeedback({
        kind: "error",
        message: "Service indisponible. Vérifiez votre connexion et réessayez.",
      });
      return;
    }

    if (!body?.success) {
      setSubmitting(false);
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
        message: body?.message ?? "Annulation impossible pour le moment.",
      });
      return;
    }

    setFeedback({ kind: "success", message: "Commande annulée." });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        className={className}
        onClick={() => setConfirmOpen(true)}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Annulation…
          </>
        ) : (
          <>
            <i className="bi bi-x-circle me-1" aria-hidden="true"></i>
            Annuler la commande
          </>
        )}
      </button>

      {feedback && (
        <div
          className={`alert ${
            feedback.kind === "success" ? "alert-success" : "alert-danger"
          } py-2 px-3 small mt-2 mb-0`}
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

      <ConfirmDialog
        open={confirmOpen}
        title="Annuler cette commande ?"
        message={
          `Le vendeur sera prévenu et les articles de la commande ${reference} ` +
          "seront remis en vente. Cette action est définitive."
        }
        confirmLabel="Oui, annuler la commande"
        cancelLabel="Garder ma commande"
        reason={{
          label: "Motif (facultatif)",
          placeholder: "Ex. : je me suis trompé de produit, je n'en ai plus besoin…",
          hint: "Le vendeur verra ce motif ; cela l'aide à s'organiser.",
        }}
        onConfirm={cancelOrder}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
