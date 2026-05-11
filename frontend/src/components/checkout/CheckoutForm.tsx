"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/checkout.module.css";

const STEPS = [
  { icon: "bi bi-person", label: "Informations" },
  { icon: "bi bi-truck", label: "Livraison" },
  { icon: "bi bi-credit-card", label: "Paiement" },
];

type PaymentMethod = "cash" | "mobile" | "pickup";

export default function CheckoutForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setSubmitting(true);
      setTimeout(() => router.push("/commandes"), 800);
    }
  }

  return (
    <>
      {/* Steps bar */}
      <div className={styles.stepsBar}>
        {STEPS.map((s, i) => {
          const cls =
            i < step
              ? styles.stepDone
              : i === step
                ? styles.stepActive
                : "";
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

      <form onSubmit={handleNext}>
        {/* Step 0 – Informations personnelles */}
        {step === 0 && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Informations personnelles</h2>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className={styles.inputLabel} htmlFor="prenom">Prénom</label>
                <input id="prenom" className={styles.inputField} type="text" placeholder="Mamadou" required />
              </div>
              <div className="col-sm-6">
                <label className={styles.inputLabel} htmlFor="nom">Nom</label>
                <input id="nom" className={styles.inputField} type="text" placeholder="Diallo" required />
              </div>
              <div className="col-12">
                <label className={styles.inputLabel} htmlFor="email">Adresse e-mail</label>
                <input id="email" className={styles.inputField} type="email" placeholder="mamadou@exemple.com" required />
              </div>
              <div className="col-12">
                <label className={styles.inputLabel} htmlFor="telephone">Téléphone</label>
                <input id="telephone" className={styles.inputField} type="tel" placeholder="+224 6XX XXX XXX" required />
              </div>
            </div>
          </div>
        )}

        {/* Step 1 – Livraison */}
        {step === 1 && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Adresse de livraison</h2>
            <div className="row g-3">
              <div className="col-12">
                <label className={styles.inputLabel} htmlFor="adresse">Adresse</label>
                <input id="adresse" className={styles.inputField} type="text" placeholder="Quartier, rue..." required />
              </div>
              <div className="col-sm-6">
                <label className={styles.inputLabel} htmlFor="ville">Ville</label>
                <input id="ville" className={styles.inputField} type="text" defaultValue="Sangarédi" required />
              </div>
              <div className="col-sm-6">
                <label className={styles.inputLabel} htmlFor="region">Région</label>
                <input id="region" className={styles.inputField} type="text" defaultValue="Boké" />
              </div>
              <div className="col-12">
                <label className={styles.inputLabel} htmlFor="note">Note pour le vendeur (optionnel)</label>
                <textarea
                  id="note"
                  className={styles.inputField}
                  placeholder="Instructions particulières pour la livraison..."
                  rows={3}
                  style={{ resize: "none" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 – Paiement */}
        {step === 2 && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Mode de paiement</h2>

            {(
              [
                {
                  id: "cash" as PaymentMethod,
                  icon: "bi bi-cash-stack",
                  label: "Paiement à la livraison",
                  desc: "Payez en espèces à la réception de votre commande.",
                },
                {
                  id: "mobile" as PaymentMethod,
                  icon: "bi bi-phone",
                  label: "Mobile Money",
                  desc: "Orange Money, MTN MoMo — virement mobile sécurisé.",
                },
                {
                  id: "pickup" as PaymentMethod,
                  icon: "bi bi-shop",
                  label: "Retrait en boutique",
                  desc: "Retirez et payez directement chez le vendeur.",
                },
              ] as const
            ).map(({ id, icon, label, desc }) => (
              <div
                key={id}
                role="button"
                tabIndex={0}
                className={`${styles.paymentOption} ${payment === id ? styles.paymentOptionSelected : ""}`}
                onClick={() => setPayment(id)}
                onKeyDown={(e) => e.key === "Enter" && setPayment(id)}
              >
                <div className={styles.paymentIcon}>
                  <i className={icon} aria-hidden="true"></i>
                </div>
                <div>
                  <div className={styles.paymentLabel}>{label}</div>
                  <p className={styles.paymentDesc}>{desc}</p>
                </div>
                <div className="ms-auto">
                  <div
                    className="rounded-circle border d-flex align-items-center justify-content-center"
                    style={{ width: 20, height: 20, borderColor: payment === id ? "var(--mf-orange)" : undefined }}
                  >
                    {payment === id && (
                      <div
                        className="rounded-circle"
                        style={{ width: 10, height: 10, background: "var(--mf-orange)" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="d-flex gap-3 mt-2">
          {step > 0 && (
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={() => setStep((s) => s - 1)}
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
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Traitement…
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
