/**
 * Composant: ForgotPasswordForm (Client Component)
 *
 * Rôle du fichier :
 *   Formulaire « Mot de passe oublié » : demande l'email et appelle le
 *   Route Handler interne POST /api/auth/forgot-password. La réponse du
 *   backend est volontairement générique (anti-énumération) : on ne
 *   révèle jamais si un compte existe.
 *
 * Où il est utilisé :
 *   - app/mot-de-passe-oublie/page.tsx
 *
 * Règles UX / honnêteté :
 *   - 503 = l'envoi d'emails n'est pas configuré côté backend : on
 *     affiche alors les moyens de contact directs (téléphone, WhatsApp)
 *     au lieu de promettre un email qui ne partira pas.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import styles from "@/styles/account.module.css";

type Status = "idle" | "loading" | "success" | "error" | "unavailable";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const loading = status === "loading";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();

      if (res.status === 503) {
        setStatus("unavailable");
        setMessage(body?.message ?? "Service momentanément indisponible.");
        return;
      }

      if (!res.ok || !body?.success) {
        setStatus("error");
        setMessage(body?.message ?? "Demande impossible. Réessayez.");
        return;
      }

      setStatus("success");
      setMessage(
        body?.message ??
          "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
      );
    } catch {
      setStatus("error");
      setMessage("Une erreur réseau est survenue. Réessayez.");
    }
  }

  return (
    <div className={styles.authCard}>
      <div className={styles.tabPanel}>
        <h1 className="h5 fw-bold mb-1">Mot de passe oublié</h1>
        <p className="text-secondary mb-4" style={{ fontSize: "0.875rem" }}>
          Indiquez l&apos;email de votre compte : nous vous enverrons un lien
          pour choisir un nouveau mot de passe.
        </p>

        {status === "success" ? (
          <>
            <div className="alert alert-success py-2 px-3 small" role="status">
              <i className="bi bi-envelope-check me-1" aria-hidden="true"></i>
              {message}
            </div>
            <Link href="/mon-compte" className="btn btn-outline-dark w-100">
              Retour à la connexion
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label className={styles.formLabel} htmlFor="forgot-email">
              Adresse e-mail
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              className={styles.formInput}
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <div className="mb-4"></div>

            {status === "error" && (
              <div className="alert alert-danger py-2 px-3 small" role="alert">
                <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                {message}
              </div>
            )}
            {status === "unavailable" && (
              <div className="alert alert-warning py-2 px-3 small" role="alert">
                <p className="mb-2">
                  <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                  {message}
                </p>
                <p className="mb-0">
                  Appelez-nous au{" "}
                  <a href={siteConfig.phoneHref} className="fw-bold">
                    {siteConfig.phone}
                  </a>{" "}
                  ou écrivez-nous sur{" "}
                  <a
                    href={siteConfig.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fw-bold"
                  >
                    WhatsApp
                  </a>{" "}
                  pour récupérer votre compte.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-warning fw-bold w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  Envoi en cours…
                </>
              ) : (
                <>
                  <i className="bi bi-envelope me-1" aria-hidden="true"></i>
                  Envoyer le lien
                </>
              )}
            </button>

            <Link
              href="/mon-compte"
              className="d-block text-center small text-decoration-none"
              style={{ color: "var(--mf-muted)", fontWeight: 600 }}
            >
              <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
              Retour à la connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
