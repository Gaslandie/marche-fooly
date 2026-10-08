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
 *   - Connexion Google : EN STAND-BY — aucun bouton Google n'est affiché
 *     tant que rien n'est branché (pas de fausse promesse). Le plan de mise
 *     en place complet est dans doc/plan/plan-connexion-inscription-google.md.
 */

"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
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

type RegisterField = keyof typeof EMPTY_REGISTER | "terms";
type RegisterErrors = Partial<Record<RegisterField, string>>;
const FIELD_IDS: Record<RegisterField, string> = {
  firstName: "reg-prenom", lastName: "reg-nom", email: "reg-email",
  phone: "reg-tel", password: "reg-password", terms: "cgu",
};
const NAME_PATTERN = new RegExp("^(?:\\p{L}\\p{M}*)+(?:[ ’'\\-](?:\\p{L}\\p{M}*)+)*$", "u");
const NAME_CHARACTERS = new RegExp("^[\\p{L}\\p{M} ’'\\-]*$", "u");
function registrationError(field: RegisterField, value: string): string {
  const clean = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (field === "firstName" || field === "lastName") {
    const label = field === "firstName" ? "prénom" : "nom";
    if (!clean) return `Saisissez votre ${label}.`;
    if (!NAME_PATTERN.test(clean)) return "Utilisez des lettres, espaces, apostrophes ou traits d’union, sans chiffres.";
    if (clean.length < 2 || clean.length > 80) return `Le ${label} doit contenir entre 2 et 80 caractères.`;
  }
  if (field === "email" && (clean.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@.]+$/.test(clean)))
    return "Saisissez une adresse e-mail complète, par exemple vous@exemple.com.";
  if (field === "phone") {
    const compact = value.replace(/[\s().-]/g, "").replace(/^(?:\+224|00224)/, "");
    if (value.length > 32 || !/^[+0-9\s().-]+$/.test(value) || !/^[1-9][0-9]{8}$/.test(compact))
      return "Saisissez 9 chiffres, avec ou sans +224. Exemple : 612 34 56 78.";
  }
  if (field === "password" && (value.length < 8 || value.length > 128))
    return "Choisissez un mot de passe de 8 à 128 caractères.";
  return "";
}

export default function AuthTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");
  const tabsId = useId();
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    let next: typeof tab;
    if (event.key === "Home") next = "login";
    else if (event.key === "End") next = "register";
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") next = tab === "login" ? "register" : "login";
    else return;
    event.preventDefault();
    setTab(next);
    (next === "login" ? loginTabRef : registerTabRef).current?.focus();
  }

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
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function checkField(field: keyof typeof EMPTY_REGISTER, value: string) {
    setRegisterErrors((errors) => ({ ...errors, [field]: registrationError(field, value) }));
  }
  function changeField(field: keyof typeof EMPTY_REGISTER, value: string) {
    setRegisterData((data) => ({ ...data, [field]: value }));
    setRegisterMessage("");
    const invalidName = (field === "firstName" || field === "lastName") && !NAME_CHARACTERS.test(value);
    const invalidPhone = field === "phone" && (/[^+0-9\s().-]/.test(value) || value.replace(/\D/g, "").length > (value.startsWith("00224") ? 14 : value.startsWith("+") ? 12 : 9));
    if (registerErrors[field] || invalidName || invalidPhone) checkField(field, value);
  }
  function fieldError(field: RegisterField) {
    return registerErrors[field] ? (
      <p id={`${FIELD_IDS[field]}-error`} className={styles.fieldError} aria-live="polite">
        {registerErrors[field]}
      </p>
    ) : null;
  }
  function fieldAccessibility(field: RegisterField, hint?: string) {
    return {
      "aria-invalid": Boolean(registerErrors[field]),
      "aria-describedby": [hint, registerErrors[field] ? `${FIELD_IDS[field]}-error` : ""].filter(Boolean).join(" ") || undefined,
    };
  }

  const loginLoading = loginStatus === "loading";
  const registerLoading = registerStatus === "loading";
  const requestedReturn = searchParams.get("retour");
  const returnPath =
    requestedReturn?.startsWith("/") &&
    !requestedReturn.startsWith("//") &&
    !requestedReturn.includes("\\") &&
    !Array.from(requestedReturn).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
      ? requestedReturn
      : "/mon-compte";

  /** Redirige vers la destination locale et force la relecture serveur. */
  function goToAccount() {
    router.push(returnPath);
    router.refresh();
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginLoading || !event.currentTarget.reportValidity()) return;
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
    if (registerLoading) return;
    const errors: RegisterErrors = {};
    for (const field of Object.keys(EMPTY_REGISTER) as (keyof typeof EMPTY_REGISTER)[]) {
      const message = registrationError(field, registerData[field]);
      if (message) errors[field] = message;
    }
    if (!acceptedTerms) errors.terms = "Acceptez les conditions d’utilisation pour créer votre compte.";
    setRegisterErrors(errors);
    const firstError = (Object.keys(errors) as RegisterField[])[0];
    if (firstError) {
      setRegisterStatus("error");
      setRegisterMessage("Vérifiez les champs indiqués ci-dessus.");
      document.getElementById(FIELD_IDS[firstError])?.focus();
      return;
    }
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
        const errors: RegisterErrors = {};
        if (Array.isArray(body?.errors)) {
          for (const error of body.errors) {
            if (Object.prototype.hasOwnProperty.call(FIELD_IDS, error.field) && typeof error.message === "string") {
              errors[error.field as RegisterField] = error.message;
            }
          }
        }
        setRegisterErrors(errors);
        const first = (Object.keys(errors) as RegisterField[])[0];
        if (first) document.getElementById(FIELD_IDS[first])?.focus();
        setRegisterMessage(first ? "Vérifiez les champs indiqués ci-dessus." : body?.message ?? "Inscription impossible. Réessayez.");
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
      <div className={styles.tabNav} role="tablist" aria-label="Accès au compte">
        <button
          type="button"
          id={`${tabsId}-login-tab`}
          ref={loginTabRef}
          aria-controls={`${tabsId}-login-panel`}
          tabIndex={tab === "login" ? 0 : -1}
          onKeyDown={handleTabKeyDown}
          role="tab"
          aria-selected={tab === "login"}
          className={`${styles.tabBtn} ${tab === "login" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("login")}
        >
          <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
          Connexion
        </button>
        <button
          type="button"
          id={`${tabsId}-register-tab`}
          ref={registerTabRef}
          aria-controls={`${tabsId}-register-panel`}
          tabIndex={tab === "register" ? 0 : -1}
          onKeyDown={handleTabKeyDown}
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
        <div className={styles.tabPanel} role="tabpanel" hidden={tab !== "login"} id={`${tabsId}-login-panel`} aria-labelledby={`${tabsId}-login-tab`}>
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
              maxLength={160}
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

            <div className="d-flex justify-content-end mt-2 mb-4">
              <Link
                href="/mot-de-passe-oublie"
                className="small text-decoration-none"
                style={{ color: "var(--mf-orange-text)", fontWeight: 600 }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

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
              className="btn btn-warning fw-bold w-100"
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
          </form>
        </div>

      {/* Register panel */}
        <div className={styles.tabPanel} role="tabpanel" hidden={tab !== "register"} id={`${tabsId}-register-panel`} aria-labelledby={`${tabsId}-register-tab`}>
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
                  onChange={(e) => changeField("firstName", e.target.value)}
                  onBlur={(e) => checkField("firstName", e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  disabled={registerLoading}
                  {...fieldAccessibility("firstName")}
                />
                {fieldError("firstName")}
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
                  onChange={(e) => changeField("lastName", e.target.value)}
                  onBlur={(e) => checkField("lastName", e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  disabled={registerLoading}
                  {...fieldAccessibility("lastName")}
                />
                {fieldError("lastName")}
              </div>
            </div>

            <label className={styles.formLabel} htmlFor="reg-email">
              Adresse e-mail
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              maxLength={160}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              className={styles.formInput}
              placeholder="vous@exemple.com"
              value={registerData.email}
              onChange={(e) => changeField("email", e.target.value)}
              onBlur={(e) => checkField("email", e.target.value)}
              required
              disabled={registerLoading}
              {...fieldAccessibility("email")}
            />
            {fieldError("email")}

            <label className={styles.formLabel} htmlFor="reg-tel">
              Téléphone
            </label>
            <input
              id="reg-tel"
              name="phone"
              type="tel"
              maxLength={32}
              autoComplete="tel"
              className={styles.formInput}
              placeholder="612 34 56 78"
              inputMode="tel"
              value={registerData.phone}
              onChange={(e) => changeField("phone", e.target.value)}
              onBlur={(e) => checkField("phone", e.target.value)}
              required
              disabled={registerLoading}
              {...fieldAccessibility("phone", "reg-tel-hint")}
            />
            {fieldError("phone")}

            <p id="reg-tel-hint" className={styles.fieldHint}>Numéro guinéen : 9 chiffres. +224 est facultatif. Les espaces sont acceptés.</p>

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
                onChange={(e) => changeField("password", e.target.value)}
                onBlur={(e) => checkField("password", e.target.value)}
                required
                minLength={8}
                maxLength={128}
                disabled={registerLoading}
                {...fieldAccessibility("password", "reg-password-hint")}
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

            {fieldError("password")}
            <p id="reg-password-hint" className={styles.fieldHint}>8 caractères minimum. Préférez une phrase longue et unique.</p>

            <div className="form-check mb-4 mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="cgu"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  setRegisterErrors((errors) => ({ ...errors, terms: e.target.checked ? "" : "Acceptez les conditions d’utilisation pour créer votre compte." }));
                }}
                {...fieldAccessibility("terms")}
                required
                disabled={registerLoading}
              />
              <label className="form-check-label text-secondary small" htmlFor="cgu">
                J&apos;accepte les{" "}
                <span style={{ color: "var(--mf-orange-text)", fontWeight: 600 }}>
                  conditions d&apos;utilisation
                </span>{" "}
                de Marché Fooly.
              </label>
            </div>

            {fieldError("terms")}
            {registerStatus === "error" && registerMessage && (
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

    </div>
  );
}
