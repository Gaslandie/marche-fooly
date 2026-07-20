/**
 * Composant: ResetPasswordForm (Client Component)
 *
 * Rôle du fichier :
 *   Formulaire de définition du nouveau mot de passe, ouvert depuis le
 *   lien reçu par email (`/reinitialiser-mot-de-passe?token=...`).
 *   Appelle le Route Handler interne POST /api/auth/reset-password avec
 *   { token, password }.
 *
 * Où il est utilisé :
 *   - app/reinitialiser-mot-de-passe/page.tsx (dans un <Suspense> car
 *     useSearchParams l'exige au build).
 *
 * Règles de sécurité :
 *   - Le token vient de l'URL et ne transite que vers le POST interne ;
 *     il n'est jamais journalisé ni stocké.
 *   - Confirmation de mot de passe vérifiée côté client (UX) ; les
 *     vraies règles (longueur, token valide) restent côté backend.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "@/styles/account.module.css";

type Status = "idle" | "loading" | "success" | "error";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const loading = status === "loading";

  // Lien ouvert sans token : inutile d'afficher un formulaire qui échouera.
  if (!token) {
    return (
      <div className={styles.authCard}>
        <div className={styles.tabPanel}>
          <h1 className="h5 fw-bold mb-3">Lien invalide</h1>
          <div className="alert alert-warning py-2 px-3 small" role="alert">
            <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
            Ce lien de réinitialisation est incomplet ou a expiré.
          </div>
          <Link href="/mot-de-passe-oublie" className="btn btn-warning fw-bold w-100">
            Refaire une demande
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setStatus("error");
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json();

      if (!res.ok || !body?.success) {
        setStatus("error");
        setMessage(body?.message ?? "Réinitialisation impossible. Réessayez.");
        return;
      }

      setStatus("success");
      setMessage(body?.message ?? "Mot de passe mis à jour.");
    } catch {
      setStatus("error");
      setMessage("Une erreur réseau est survenue. Réessayez.");
    }
  }

  return (
    <div className={styles.authCard}>
      <div className={styles.tabPanel}>
        <h1 className="h5 fw-bold mb-1">Nouveau mot de passe</h1>
        <p className="text-secondary mb-4" style={{ fontSize: "0.875rem" }}>
          Choisissez un nouveau mot de passe pour votre compte Marché Fooly.
        </p>

        {status === "success" ? (
          <>
            <div className="alert alert-success py-2 px-3 small" role="status">
              <i className="bi bi-check-circle me-1" aria-hidden="true"></i>
              {message}
            </div>
            <Link href="/mon-compte" className="btn btn-warning fw-bold w-100">
              <i className="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>
              Se connecter
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label className={styles.formLabel} htmlFor="reset-password">
              Nouveau mot de passe
            </label>
            <div className={styles.passwordField}>
              <input
                id="reset-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className={`${styles.formInput} ${styles.passwordInput}`}
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                aria-pressed={showPassword}
                disabled={loading}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  aria-hidden="true"
                ></i>
              </button>
            </div>

            <label className={styles.formLabel} htmlFor="reset-confirm">
              Confirmer le mot de passe
            </label>
            <input
              id="reset-confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={styles.formInput}
              placeholder="Retapez le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />

            <div className="mb-4"></div>

            {status === "error" && (
              <div className="alert alert-danger py-2 px-3 small" role="alert">
                <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-warning fw-bold w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  Mise à jour…
                </>
              ) : (
                <>
                  <i className="bi bi-key me-1" aria-hidden="true"></i>
                  Définir le mot de passe
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
