/**
 * Composant: AuthTabs (Client Component)
 *
 * Rôle du fichier :
 *   Onglets « Connexion / Inscription » de la page /mon-compte.
 *   Les deux formulaires sont contrôlés et soumis aux Route Handlers
 *   INTERNES de Next.js :
 *     - POST /api/auth/login
 *     - POST /api/auth/register
 *
 * Où il est utilisé :
 *   - app/mon-compte/page.tsx
 *
 * Règles de sécurité (IMPORTANT) :
 *   - Ce Client Component n'appelle JAMAIS le backend Express
 *     directement : il passe par les Route Handlers internes, qui
 *     posent le JWT dans un cookie httpOnly côté serveur.
 *   - Aucun token n'est manipulé, stocké (localStorage/sessionStorage)
 *     ni journalisé ici. La réponse des routes internes ne contient
 *     que `{ success, message, user }`.
 *
 * Notes UX :
 *   - États gérés par formulaire : idle / loading / error / success.
 *   - Boutons désactivés pendant l'envoi.
 *   - Après succès : redirection vers /mon-compte ou vers le retour local
 *     demandé en query string + router.refresh()
 *     pour que les Server Components relisent la session (cookie).
 *
 * Note pour GitHub Copilot :
 *   - Le champ téléphone est `required` (le backend l'exige).
 *   - « Continuer avec Google » est volontairement désactivé : pas de
 *     fournisseur OAuth branché — on n'affiche pas de fausse promesse.
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/styles/account.module.css";

type Status = "idle" | "loading" | "error" | "success";

const EMPTY_LOGIN = { email: "", password: "" };
const EMPTY_REGISTER = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

export default function AuthTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");

  // --- État du formulaire de connexion ---
  const [loginData, setLoginData] = useState(EMPTY_LOGIN);
  const [loginStatus, setLoginStatus] = useState<Status>("idle");
  const [loginMessage, setLoginMessage] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // --- État du formulaire d'inscription ---
  const [registerData, setRegisterData] = useState(EMPTY_REGISTER);
  const [registerStatus, setRegisterStatus] = useState<Status>("idle");
  const [registerMessage, setRegisterMessage] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const loginLoading = loginStatus === "loading";
  const registerLoading = registerStatus === "loading";
  const requestedReturn = searchParams.get("retour");
  const returnPath =
    requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//")
      ? requestedReturn
      : "/mon-compte";

  /** Redirige vers la destination locale et force la relecture serveur. */
  function goToAccount() {
    router.push(returnPath);
    router.refresh();
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginStatus("loading");
    setLoginMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const body = await res.json();

      if (!res.ok || !body?.success) {
        setLoginStatus("error");
        setLoginMessage(body?.message ?? "Connexion impossible. Réessayez.");
        return;
      }

      setLoginStatus("success");
      setLoginMessage(body?.message ?? "Connexion réussie.");
      goToAccount();
    } catch {
      setLoginStatus("error");
      setLoginMessage("Une erreur réseau est survenue. Réessayez.");
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterStatus("loading");
    setRegisterMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const body = await res.json();

      if (!res.ok || !body?.success) {
        setRegisterStatus("error");
        setRegisterMessage(
          body?.message ?? "Inscription impossible. Réessayez.",
        );
        return;
      }

      setRegisterStatus("success");
      setRegisterMessage(body?.message ?? "Compte créé avec succès.");
      goToAccount();
    } catch {
      setRegisterStatus("error");
      setRegisterMessage("Une erreur réseau est survenue. Réessayez.");
    }
  }

  return (
    <div className={styles.authCard}>
      <div className={styles.tabNav} role="tablist">
        <button
          role="tab"
          aria-selected={tab === "login"}
          className={`${styles.tabBtn} ${tab === "login" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("login")}
        >
          <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
          Connexion
        </button>
        <button
          role="tab"
          aria-selected={tab === "register"}
          className={`${styles.tabBtn} ${tab === "register" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("register")}
        >
          <i className="bi bi-person-plus me-2" aria-hidden="true"></i>
          Inscription
        </button>
      </div>

      {/* Login panel */}
      {tab === "login" && (
        <div className={styles.tabPanel} role="tabpanel">
          <h2 className="h5 fw-bold mb-1">Bon retour sur Marché Fooly</h2>
          <p className="text-secondary mb-4" style={{ fontSize: "0.875rem" }}>
            Connectez-vous pour accéder à vos commandes et favoris.
          </p>

          <form onSubmit={handleLogin} noValidate>
            <label className={styles.formLabel} htmlFor="login-email">
              Adresse e-mail
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className={styles.formInput}
              placeholder="vous@exemple.com"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({ ...loginData, email: e.target.value })
              }
              required
              disabled={loginLoading}
            />

            <label className={styles.formLabel} htmlFor="login-password">
              Mot de passe
            </label>
            <div className={styles.passwordField}>
              <input
                id="login-password"
                name="password"
                type={showLoginPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`${styles.formInput} ${styles.passwordInput}`}
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
                disabled={loginLoading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowLoginPassword((visible) => !visible)}
                aria-label={
                  showLoginPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                aria-pressed={showLoginPassword}
                disabled={loginLoading}
              >
                <i
                  className={`bi ${showLoginPassword ? "bi-eye-slash" : "bi-eye"}`}
                  aria-hidden="true"
                ></i>
              </button>
            </div>

            <div className="mb-4"></div>

            {loginStatus === "error" && (
              <div className="alert alert-danger py-2 px-3 small" role="alert">
                <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                {loginMessage}
              </div>
            )}
            {loginStatus === "success" && (
              <div className="alert alert-success py-2 px-3 small" role="status">
                <i className="bi bi-check-circle me-1" aria-hidden="true"></i>
                {loginMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-warning fw-bold w-100 mb-3"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  Connexion en cours…
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>
                  Se connecter
                </>
              )}
            </button>

            <div className={styles.dividerLine}>ou</div>

            {/* Bouton désactivé : aucun fournisseur OAuth n'est branché.
                Un bouton inactif n'affiche aucune fausse promesse. */}
            <button
              type="button"
              className="btn btn-outline-dark w-100"
              disabled
            >
              <i className="bi bi-google me-2" aria-hidden="true"></i>
              Continuer avec Google
            </button>
          </form>
        </div>
      )}

      {/* Register panel */}
      {tab === "register" && (
        <div className={styles.tabPanel} role="tabpanel">
          <h2 className="h5 fw-bold mb-1">Créer un compte Marché Fooly</h2>
          <p className="text-secondary mb-4" style={{ fontSize: "0.875rem" }}>
            Rejoignez la marketplace locale de Sangarédi.
          </p>

          <form onSubmit={handleRegister} noValidate>
            <div className="row g-3 mb-0">
              <div className="col-sm-6">
                <label className={styles.formLabel} htmlFor="reg-prenom">
                  Prénom
                </label>
                <input
                  id="reg-prenom"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  className={styles.formInput}
                  placeholder="Mamadou"
                  value={registerData.firstName}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, firstName: e.target.value })
                  }
                  required
                  minLength={2}
                  disabled={registerLoading}
                />
              </div>
              <div className="col-sm-6">
                <label className={styles.formLabel} htmlFor="reg-nom">
                  Nom
                </label>
                <input
                  id="reg-nom"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  className={styles.formInput}
                  placeholder="Diallo"
                  value={registerData.lastName}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, lastName: e.target.value })
                  }
                  required
                  minLength={2}
                  disabled={registerLoading}
                />
              </div>
            </div>

            <label className={styles.formLabel} htmlFor="reg-email">
              Adresse e-mail
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              className={styles.formInput}
              placeholder="vous@exemple.com"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({ ...registerData, email: e.target.value })
              }
              required
              disabled={registerLoading}
            />

            <label className={styles.formLabel} htmlFor="reg-tel">
              Téléphone
            </label>
            <input
              id="reg-tel"
              name="phone"
              type="tel"
              autoComplete="tel"
              className={styles.formInput}
              placeholder="+224 6XX XXX XXX"
              value={registerData.phone}
              onChange={(e) =>
                setRegisterData({ ...registerData, phone: e.target.value })
              }
              required
              disabled={registerLoading}
            />

            <label className={styles.formLabel} htmlFor="reg-password">
              Mot de passe
            </label>
            <div className={styles.passwordField}>
              <input
                id="reg-password"
                name="password"
                type={showRegisterPassword ? "text" : "password"}
                autoComplete="new-password"
                className={`${styles.formInput} ${styles.passwordInput}`}
                placeholder="Minimum 8 caractères"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({ ...registerData, password: e.target.value })
                }
                required
                minLength={8}
                disabled={registerLoading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowRegisterPassword((visible) => !visible)}
                aria-label={
                  showRegisterPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                aria-pressed={showRegisterPassword}
                disabled={registerLoading}
              >
                <i
                  className={`bi ${showRegisterPassword ? "bi-eye-slash" : "bi-eye"}`}
                  aria-hidden="true"
                ></i>
              </button>
            </div>

            <div className="form-check mb-4 mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="cgu"
                required
                disabled={registerLoading}
              />
              <label className="form-check-label text-secondary small" htmlFor="cgu">
                J&apos;accepte les{" "}
                <span style={{ color: "var(--mf-orange)", fontWeight: 600 }}>
                  conditions d&apos;utilisation
                </span>{" "}
                de Marché Fooly.
              </label>
            </div>

            {registerStatus === "error" && (
              <div className="alert alert-danger py-2 px-3 small" role="alert">
                <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                {registerMessage}
              </div>
            )}
            {registerStatus === "success" && (
              <div className="alert alert-success py-2 px-3 small" role="status">
                <i className="bi bi-check-circle me-1" aria-hidden="true"></i>
                {registerMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-warning fw-bold w-100"
              disabled={registerLoading}
            >
              {registerLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  Création du compte…
                </>
              ) : (
                <>
                  <i className="bi bi-person-check me-1" aria-hidden="true"></i>
                  Créer mon compte
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
