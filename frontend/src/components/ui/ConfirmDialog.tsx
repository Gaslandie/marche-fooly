/**
 * Composant: ConfirmDialog (Client Component)
 *
 * Rôle du fichier :
 *   Dialogue de confirmation dans la page (remplace `window.confirm`,
 *   dont l'apparence dépend du navigateur/téléphone et casse l'ambiance
 *   du site — retour cliente/propriétaire du 22/09/2026). Premier modal
 *   du projet : réutilisable pour toute confirmation d'action.
 *
 * Où il est utilisé :
 *   - components/orders/CancelOrderButton.tsx (annulation acheteur)
 *   - components/seller/OrderStatusActions.tsx (annulation vendeur)
 *   - réutilisable pour d'autres confirmations (suppression produit…).
 *
 * Variante « avec motif » (prop `reason`) :
 *   Affiche un champ texte dont la valeur est renvoyée à `onConfirm`.
 *   Quand `reason.required` est vrai, le bouton de confirmation reste
 *   désactivé tant que le champ est vide — utilisé pour l'annulation
 *   vendeur, où le motif est obligatoire (le client doit comprendre
 *   pourquoi sa commande n'arrivera pas).
 *
 * Règles techniques :
 *   - Bootstrap est chargé en CSS SEULEMENT (pas de bundle JS) : le modal
 *     est donc entièrement contrôlé par React (prop `open`), avec les
 *     classes Bootstrap pour le rendu. Pas d'attributs data-bs-*.
 *   - Rendu via createPortal(document.body) : aucun ancêtre (carte avec
 *     transform, overflow…) ne peut casser le positionnement fixe.
 *   - Ne rend RIEN tant que `open` est false -> aucun souci SSR.
 *
 * Accessibilité :
 *   - role="dialog" + aria-modal + aria-labelledby/aria-describedby ;
 *   - Échap ferme, clic sur le fond ferme, focus initial sur « garder »
 *     (l'option la moins destructive) ;
 *   - le scroll de la page est gelé tant que le dialogue est ouvert.
 */

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Champ « motif » optionnel affiché dans le dialogue. */
type ReasonField = {
  label: string;
  placeholder?: string;
  /** Si vrai, la confirmation est bloquée tant que le champ est vide. */
  required?: boolean;
  /** Aide affichée sous le champ. */
  hint?: string;
};

type Props = {
  open: boolean;
  title: string;
  /** Texte explicatif sous le titre. */
  message: string;
  /** Libellé du bouton qui confirme l'action (défaut : « Confirmer »). */
  confirmLabel?: string;
  /** Libellé du bouton qui referme sans rien faire (défaut : « Retour »). */
  cancelLabel?: string;
  /** Demande un motif saisi par l'utilisateur, transmis à `onConfirm`. */
  reason?: ReasonField;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

const REASON_MAX_LENGTH = 300;

/**
 * Enveloppe : ne monte le contenu QUE lorsque le dialogue est ouvert.
 * C'est ce démontage qui garantit un champ « motif » vide à chaque
 * ouverture, sans setState dans un effet (règle ESLint
 * `react-hooks/set-state-in-effect`, cf. CartProvider).
 */
export default function ConfirmDialog({ open, ...rest }: Props) {
  if (!open) return null;
  return <DialogContent {...rest} />;
}

function DialogContent({
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Retour",
  reason,
  onConfirm,
  onClose,
}: Omit<Props, "open">) {
  const titleId = useId();
  const messageId = useId();
  const reasonId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [reasonValue, setReasonValue] = useState("");

  const trimmedReason = reasonValue.trim();
  const confirmDisabled = Boolean(reason?.required) && trimmedReason.length === 0;

  // Échap ferme + scroll de page gelé tant que le dialogue est monté.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <>
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          // Le clic DANS la boîte ne doit pas fermer (seul le fond ferme).
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-content rounded-3 shadow">
            <div className="modal-header border-0 pb-0">
              <h2 className="modal-title h5 fw-bold" id={titleId}>
                {title}
              </h2>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Fermer"
              ></button>
            </div>
            <div className="modal-body pt-2">
              <p className="text-secondary mb-0" id={messageId}>
                {message}
              </p>

              {reason && (
                <div className="mt-3">
                  <label className="form-label fw-semibold" htmlFor={reasonId}>
                    {reason.label}
                    {reason.required && (
                      <span className="text-danger">&nbsp;*</span>
                    )}
                  </label>
                  <textarea
                    id={reasonId}
                    className="form-control"
                    rows={3}
                    style={{ resize: "none" }}
                    placeholder={reason.placeholder}
                    value={reasonValue}
                    onChange={(event) => setReasonValue(event.target.value)}
                    maxLength={REASON_MAX_LENGTH}
                    required={reason.required}
                  />
                  {reason.hint && (
                    <p className="form-text mb-0">{reason.hint}</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={onClose}
                ref={cancelButtonRef}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="btn btn-danger fw-bold"
                onClick={() => onConfirm(trimmedReason)}
                disabled={confirmDisabled}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
