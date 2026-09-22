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
 *   - L'annulation demande une confirmation explicite via ConfirmDialog
 *     (dialogue dans la page, pas window.confirm) ET un MOTIF obligatoire
 *     (décision cliente du 22/09/2026) : le backend refuse en 422 sans
 *     motif, et le transmet au client dans sa notification. Le backend
 *     restaure le stock.
 *   - Après une annulation réussie, un bouton d'appel direct du client
 *     (lien tel:) est proposé pour expliquer la raison de vive voix.
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
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  getSellerStatusTransitions,
  type SellerStatusTransition,
} from "@/lib/orderStatus";

type Props = {
  reference: string;
  status: string;
  /** Téléphone du client, pour l'appel direct après une annulation. */
  customerPhone?: string;
};

type Feedback = { kind: "success" | "error"; message: string };

/**
 * Nettoie un numéro pour un lien `tel:` (on garde le + initial et les
 * chiffres ; espaces, tirets et parenthèses sont retirés).
 */
function toTelHref(phone: string): string {
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  return cleaned.startsWith("+")
    ? `+${cleaned.slice(1).replace(/\+/g, "")}`
    : cleaned;
}

export default function OrderStatusActions({
  reference,
  status,
  customerPhone = "",
}: Props) {
  const router = useRouter();
  const transitions = getSellerStatusTransitions(status);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Transition « annuler » en attente de confirmation dans le dialogue.
  const [confirmCancel, setConfirmCancel] =
    useState<SellerStatusTransition | null>(null);
  // Passe à vrai après une annulation réussie : on propose alors
  // d'appeler le client tout de suite pour lui expliquer.
  const [justCancelled, setJustCancelled] = useState(false);

  const telHref = customerPhone ? toTelHref(customerPhone) : "";

  /**
   * Encart « appeler le client », affiché juste après une annulation :
   * le vendeur explique de vive voix, sans chercher le numéro ailleurs.
   */
  const callClientBlock =
    justCancelled && telHref ? (
      <div className="alert alert-warning py-2 px-3 small mt-3 mb-0">
        <p className="mb-2">
          <i className="bi bi-telephone me-1" aria-hidden="true"></i>
          Prévenez le client de vive voix : il a reçu le motif, mais un appel
          évite les malentendus.
        </p>
        <a href={`tel:${telHref}`} className="btn btn-dark btn-sm fw-bold">
          <i className="bi bi-telephone-fill me-1" aria-hidden="true"></i>
          Appeler le client ({customerPhone})
        </a>
      </div>
    ) : null;

  // Statut terminal : plus aucune transition, mais on garde l'encart
  // d'appel si l'annulation vient d'être faite depuis cet écran.
  if (transitions.length === 0) {
    return (
      <div>
        <p className="text-secondary small mb-0">
          <i className="bi bi-check2-circle me-1" aria-hidden="true"></i>
          Aucune action disponible pour ce statut.
        </p>
        {callClientBlock}
      </div>
    );
  }

  /** Clic sur un bouton : l'annulation passe d'abord par le dialogue. */
  function handleTransitionClick(transition: SellerStatusTransition) {
    if (transition.intent === "cancel") {
      setConfirmCancel(transition);
      return;
    }
    void applyTransition(transition);
  }

  /**
   * Lancé directement (avance) ou après confirmation (annulation).
   * `reason` n'est transmis que pour une annulation ; le backend le
   * refuse en 422 s'il est vide côté vendeur.
   */
  async function applyTransition(
    transition: SellerStatusTransition,
    reason = "",
  ) {
    const isCancel = transition.intent === "cancel";
    setConfirmCancel(null);
    setPendingTarget(transition.target);
    setFeedback(null);

    let httpStatus = 0;
    let body: { success?: boolean; message?: string } | null = null;
    try {
      const res = await fetch(`/api/orders/${reference}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCancel
            ? { status: transition.target, cancellationReason: reason }
            : { status: transition.target },
        ),
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
    if (isCancel) setJustCancelled(true);
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
              onClick={() => handleTransitionClick(transition)}
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

      {callClientBlock}

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Annuler cette commande ?"
        message={
          "Le client sera prévenu et le stock des articles sera restauré. " +
          "Cette action est définitive."
        }
        confirmLabel="Oui, annuler la commande"
        cancelLabel="Retour"
        reason={{
          label: "Motif de l'annulation",
          placeholder:
            "Ex. : fortes pluies, route impraticable ; produit finalement indisponible…",
          required: true,
          hint: "Ce motif sera transmis au client pour qu'il comprenne la raison.",
        }}
        onConfirm={(reason) => {
          if (confirmCancel) void applyTransition(confirmCancel, reason);
        }}
        onClose={() => setConfirmCancel(null)}
      />
    </div>
  );
}
