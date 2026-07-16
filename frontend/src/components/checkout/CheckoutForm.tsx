/**
 * Composant: CheckoutForm (Client Component)
 *
 * Rôle du fichier :
 *   Formulaire de checkout en 3 étapes (Infos / Livraison / Paiement)
 *   qui soumet réellement la commande au backend via le Route Handler
 *   interne POST /api/orders (BFF). Le JWT reste dans le cookie httpOnly.
 *
 * Où il est utilisé :
 *   - app/checkout/page.tsx
 *
 * Règles de sécurité (IMPORTANT) :
 *   - On envoie EXCLUSIVEMENT les champs acceptés par le backend :
 *       items[{product, quantity}], paymentMethod, fulfillmentMethod,
 *       customerPhone, shippingAddress?, notes?.
 *     RIEN d'autre — surtout pas prix, subtotal, total, seller,
 *     customer, reference, status. Le backend recalcule tout.
 *   - On passe par /api/orders (interne) qui ajoute le Bearer côté
 *     serveur : le navigateur n'a jamais accès au token.
 *
 * Règles métier :
 *   - Mapping UI → backend :
 *       « Livraison à domicile »  -> cash_on_delivery + home_delivery
 *       « Retrait en boutique »   -> pay_on_pickup + seller_pickup
 *     (Mobile Money : retiré de l'UI — pas de fausse promesse tant que
 *      le paiement mobile n'est pas réellement branché.)
 *   - shippingAddress n'est envoyée QUE pour la livraison à domicile.
 *   - Sur succès : `clearCart()` puis redirection vers la page de
 *     confirmation `/commande/[reference]`.
 *
 * Note pour GitHub Copilot :
 *   - Le composant reçoit `user` en prop (pré-remplissage des champs).
 *     L'identité (nom, email) est lecture seule : pour la modifier,
 *     l'utilisateur passe par /mon-compte. Le téléphone est éditable
 *     (il peut différer pour la livraison).
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import type { AuthUser } from "@/types/auth";
import styles from "@/styles/checkout.module.css";

const STEPS = [
  { icon: "bi bi-person", label: "Informations" },
  { icon: "bi bi-truck", label: "Livraison" },
  { icon: "bi bi-credit-card", label: "Paiement" },
];

type Mode = "delivery" | "pickup";

type Props = {
  user: AuthUser;
};

export default function CheckoutForm({ user }: Props) {
  const router = useRouter();
  const { lines, clearCart } = useCart();

  const [step, setStep] = useState(0);

  // Téléphone : pré-rempli, éditable (peut différer du téléphone du compte).
  const [phone, setPhone] = useState(user.phone ?? "");

  // Adresse de livraison (pré-remplie si dispo, éditable, optionnelle si pickup).
  const [street, setStreet] = useState(user.address?.street ?? "");
  const [city, setCity] = useState(user.address?.city ?? "Sangarédi");
  const [region, setRegion] = useState(user.address?.region ?? "Boké");
  const [country, setCountry] = useState(user.address?.country ?? "Guinée");
  const [postalCode, setPostalCode] = useState(user.address?.postalCode ?? "");
  const [notes, setNotes] = useState("");

  const [mode, setMode] = useState<Mode>("delivery");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ── État panier vide ──────────────────────────────────────────── */
  if (lines.length === 0) {
    return (
      <div className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Votre panier est vide</h2>
        <p className="text-secondary mb-3">
          Ajoutez au moins un produit pour pouvoir passer commande.
        </p>
        <Link href="/panier" className="btn btn-outline-dark">
          <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
          Retour au panier
        </Link>
      </div>
    );
  }

  /* ── Validation par étape ──────────────────────────────────────── */
  function validateStep(currentStep: number): string | null {
    if (currentStep === 0) {
      if (!phone.trim()) return "Téléphone requis.";
      return null;
    }
    if (currentStep === 1) {
      // Adresse optionnelle ici (selon le mode choisi à l'étape 2).
      // On valide juste la longueur si non vide.
      return null;
    }
    return null;
  }

  /* ── Construction du payload ───────────────────────────────────── */
  function buildPayload() {
    const paymentMethod =
      mode === "pickup" ? "pay_on_pickup" : "cash_on_delivery";
    const fulfillmentMethod =
      mode === "pickup" ? "seller_pickup" : "home_delivery";

    const payload: Record<string, unknown> = {
      items: lines.map((l) => ({
        product: l.productId,
        quantity: l.quantity,
      })),
      paymentMethod,
      fulfillmentMethod,
      customerPhone: phone.trim(),
    };

    if (mode === "delivery") {
      payload.shippingAddress = {
        street: street.trim(),
        city: city.trim(),
        region: region.trim(),
        country: country.trim(),
        postalCode: postalCode.trim(),
      };
    }

    const trimmedNotes = notes.trim();
    if (trimmedNotes) payload.notes = trimmedNotes;

    return payload;
  }

  /* ── Soumission finale ─────────────────────────────────────────── */
  async function submitOrder() {
    setErrorMessage(null);

    // Validations frontend minimales (le backend est la source de vérité).
    if (!phone.trim()) {
      setStep(0);
      setErrorMessage("Téléphone requis.");
      return;
    }
    if (mode === "delivery" && (!street.trim() || !city.trim())) {
      setStep(1);
      setErrorMessage("Adresse et ville requises pour une livraison à domicile.");
      return;
    }

    setSubmitting(true);
    let body: { success?: boolean; message?: string; order?: { reference?: string } | null } | null = null;
    let httpOk = false;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      httpOk = res.ok;
      body = await res.json();
    } catch {
      setSubmitting(false);
      setErrorMessage(
        "Service de commande indisponible. Vérifiez votre connexion et réessayez.",
      );
      return;
    }

    if (!httpOk || !body?.success || !body.order?.reference) {
      setSubmitting(false);
      setErrorMessage(body?.message ?? "Impossible de créer la commande.");
      return;
    }

    const reference = body.order.reference;
    clearCart();
    router.push(`/commande/${reference}`);
  }

  /* ── Soumission du formulaire (Continuer / Confirmer) ──────────── */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateStep(step);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage(null);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      void submitOrder();
    }
  }

  /* ── Rendu ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* Barre d'étapes */}
      <div className={styles.stepsBar}>
        {STEPS.map((s, i) => {
          const cls =
            i < step ? styles.stepDone : i === step ? styles.stepActive : "";
          return (
            <div key={s.label} className={`${styles.step} ${cls}`}>
              <div className={styles.stepIcon}>
                <i className={s.icon} aria-hidden="true"></i>
              </div>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Étape 0 — Informations personnelles */}
        {step === 0 && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Vos informations</h2>
            <p className="text-secondary small mb-4">
              Vous commandez en tant que <strong>{user.firstName} {user.lastName}</strong>
              {" · "}{user.email}. Pour modifier ces informations, rendez-vous dans{" "}
              <Link href="/mon-compte" className="text-decoration-none fw-semibold">
                Mon compte
              </Link>
              .
            </p>
            <div className="row g-3">
              <div className="col-12">
                <label className={styles.inputLabel} htmlFor="telephone">
                  Téléphone de contact
                </label>
                <input
                  id="telephone"
                  name="customerPhone"
                  className={styles.inputField}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+224 6XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 1 — Adresse de livraison */}
        {step === 1 && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Adresse de livraison</h2>
            <p className="text-secondary small mb-4">
              Optionnelle si vous choisissez le retrait en boutique à l&apos;étape
              suivante. Sinon, remplissez au moins l&apos;adresse et la ville.
            </p>
            <div className="row g-3">
              <div className="col-12">
                <label className={styles.inputLabel} htmlFor="adresse">
                  Adresse
                </label>
                <input
                  id="adresse"
                  className={styles.inputField}
                  type="text"
                  placeholder="Quartier, rue…"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="col-sm-6">
                <label className={styles.inputLabel} htmlFor="ville">
                  Ville
                </label>
                <input
                  id="ville"
                  className={styles.inputField}
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="col-sm-6">
                <label className={styles.inputLabel} htmlFor="region">
                  Région
                </label>
                <input
                  id="region"
                  className={styles.inputField}
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="col-sm-6">
                <label className={styles.inputLabel} htmlFor="country">
                  Pays
                </label>
                <input
                  id="country"
                  className={styles.inputField}
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="col-sm-6">
                <label className={styles.inputLabel} htmlFor="postalCode">
                  Code postal
                </label>
                <input
                  id="postalCode"
                  className={styles.inputField}
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="col-12">
                <label className={styles.inputLabel} htmlFor="note">
                  Note pour le vendeur (optionnel)
                </label>
                <textarea
                  id="note"
                  className={styles.inputField}
                  placeholder="Instructions particulières pour la livraison…"
                  rows={3}
                  style={{ resize: "none" }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={800}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 — Mode de réception + paiement */}
        {step === 2 && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Mode de réception et paiement</h2>

            {/* Option 1 : Livraison + paiement à la livraison */}
            <div
              role="button"
              tabIndex={0}
              className={`${styles.paymentOption} ${mode === "delivery" ? styles.paymentOptionSelected : ""}`}
              onClick={() => setMode("delivery")}
              onKeyDown={(e) => e.key === "Enter" && setMode("delivery")}
            >
              <div className={styles.paymentIcon}>
                <i className="bi bi-cash-stack" aria-hidden="true"></i>
              </div>
              <div>
                <div className={styles.paymentLabel}>Livraison + paiement à la livraison</div>
                <p className={styles.paymentDesc}>
                  Vous payez en espèces à la réception de votre commande.
                </p>
              </div>
              <div className="ms-auto">
                <Radio selected={mode === "delivery"} />
              </div>
            </div>

            {/* Option 2 : Retrait boutique + paiement au retrait */}
            <div
              role="button"
              tabIndex={0}
              className={`${styles.paymentOption} ${mode === "pickup" ? styles.paymentOptionSelected : ""}`}
              onClick={() => setMode("pickup")}
              onKeyDown={(e) => e.key === "Enter" && setMode("pickup")}
            >
              <div className={styles.paymentIcon}>
                <i className="bi bi-shop" aria-hidden="true"></i>
              </div>
              <div>
                <div className={styles.paymentLabel}>Retrait en boutique</div>
                <p className={styles.paymentDesc}>
                  Vous retirez et payez directement chez le vendeur.
                </p>
              </div>
              <div className="ms-auto">
                <Radio selected={mode === "pickup"} />
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger py-2 px-3 small" role="alert">
            <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
            {errorMessage}
          </div>
        )}

        <div className="d-flex gap-3 mt-2">
          {step > 0 && (
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={() => {
                setErrorMessage(null);
                setStep((s) => s - 1);
              }}
              disabled={submitting}
            >
              <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
              Retour
            </button>
          )}
          <button
            type="submit"
            className="btn btn-warning fw-bold flex-grow-1"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Envoi de la commande…
              </>
            ) : step < STEPS.length - 1 ? (
              <>
                Continuer
                <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
              </>
            ) : (
              <>
                <i className="bi bi-bag-check me-1" aria-hidden="true"></i>
                Confirmer la commande
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}

/** Petit indicateur radio rond, réutilisé pour les 3 options. */
function Radio({ selected }: { selected: boolean }) {
  return (
    <div
      className="rounded-circle border d-flex align-items-center justify-content-center"
      style={{
        width: 20,
        height: 20,
        borderColor: selected ? "var(--mf-orange)" : undefined,
      }}
    >
      {selected && (
        <div
          className="rounded-circle"
          style={{ width: 10, height: 10, background: "var(--mf-orange)" }}
        />
      )}
    </div>
  );
}
