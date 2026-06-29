"use client";

import { useState } from "react";
import styles from "@/styles/contact.module.css";

const SUBJECTS = [
  "Question sur un produit",
  "Suivi de commande",
  "Devenir vendeur",
  "Partenariat",
  "Support technique",
  "Autre demande",
];

type ContactFormProps = {
  hasSellerStatus?: boolean;
};

export default function ContactForm({ hasSellerStatus = false }: ContactFormProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const subjects = hasSellerStatus
    ? SUBJECTS.map((subject) =>
        subject === "Devenir vendeur" ? "Support vendeur" : subject,
      )
    : SUBJECTS;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 800);
  }

  if (sent) {
    return (
      <div className={styles.formCard} style={{ textAlign: "center", padding: "3rem" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--mf-green)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 1.25rem",
            fontSize: "2rem",
            color: "#ffffff",
          }}
        >
          <i className="bi bi-check-lg" aria-hidden="true"></i>
        </div>
        <h2 className="h4 fw-bold mb-2">Message envoyé !</h2>
        <p className="text-secondary mb-4">
          L&apos;équipe Marché Fooly vous répondra dans les meilleurs délais.
        </p>
        <button type="button" className="btn btn-outline-dark" onClick={() => setSent(false)}>
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <div className="mb-4">
        <span className="fw-bold" style={{ color: "var(--mf-orange)" }}>
          Envoyer un message
        </span>
        <h2 className="h2 fw-bold mb-2">Comment pouvons-nous vous aider ?</h2>
        <p className="text-secondary mb-0">
          Votre message sera transmis directement à l&apos;équipe FOOLY, qui vous répondra dans les meilleurs délais.
        </p>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="fullName">
            Nom complet
          </label>
          <input
            id="fullName"
            className={styles.inputField}
            type="text"
            placeholder="Votre nom"
            required
          />
        </div>

        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="phone">
            Téléphone
          </label>
          <input
            id="phone"
            className={styles.inputField}
            type="tel"
            placeholder="+224 6XX XX XX XX"
          />
        </div>

        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={styles.inputField}
            type="email"
            placeholder="votre@email.com"
            required
          />
        </div>

        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="subject">
            Sujet
          </label>
          <select
            id="subject"
            className={styles.inputField}
            defaultValue=""
            required
            style={{ appearance: "auto" }}
          >
            <option value="" disabled>
              Choisir un sujet
            </option>
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="col-12">
          <label className={styles.inputLabel} htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            className={styles.inputField}
            placeholder="Expliquez votre demande..."
            rows={5}
            required
          />
        </div>

        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="contactAgree"
              required
            />
            <label className="form-check-label text-secondary small" htmlFor="contactAgree">
              J&apos;accepte d&apos;être contacté par Marché Fooly concernant ma demande.
            </label>
          </div>
        </div>

        <div className="col-12">
          <button
            className="btn btn-warning fw-bold w-100"
            type="submit"
            disabled={sending}
          >
            {sending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Envoi en cours…
              </>
            ) : (
              <>
                <i className="bi bi-send me-1" aria-hidden="true"></i>
                Envoyer le message
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
