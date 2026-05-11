"use client";

import { useState } from "react";
import styles from "@/styles/account.module.css";

export default function AuthTabs() {
  const [tab, setTab] = useState<"login" | "register">("login");

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

          <form>
            <label className={styles.formLabel} htmlFor="login-email">
              Adresse e-mail
            </label>
            <input
              id="login-email"
              type="email"
              className={styles.formInput}
              placeholder="vous@exemple.com"
              required
            />

            <label className={styles.formLabel} htmlFor="login-password">
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              className={styles.formInput}
              placeholder="••••••••"
              required
            />

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="remember-me" />
                <label className="form-check-label text-secondary small" htmlFor="remember-me">
                  Se souvenir de moi
                </label>
              </div>
              <span className="small fw-semibold" style={{ color: "var(--mf-orange)", cursor: "pointer" }}>
                Mot de passe oublié ?
              </span>
            </div>

            <button type="submit" className="btn btn-warning fw-bold w-100 mb-3">
              <i className="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>
              Se connecter
            </button>

            <div className={styles.dividerLine}>ou</div>

            <button type="button" className="btn btn-outline-dark w-100">
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

          <form>
            <div className="row g-3 mb-0">
              <div className="col-sm-6">
                <label className={styles.formLabel} htmlFor="reg-prenom">
                  Prénom
                </label>
                <input
                  id="reg-prenom"
                  type="text"
                  className={styles.formInput}
                  placeholder="Mamadou"
                  required
                />
              </div>
              <div className="col-sm-6">
                <label className={styles.formLabel} htmlFor="reg-nom">
                  Nom
                </label>
                <input
                  id="reg-nom"
                  type="text"
                  className={styles.formInput}
                  placeholder="Diallo"
                  required
                />
              </div>
            </div>

            <label className={styles.formLabel} htmlFor="reg-email">
              Adresse e-mail
            </label>
            <input
              id="reg-email"
              type="email"
              className={styles.formInput}
              placeholder="vous@exemple.com"
              required
            />

            <label className={styles.formLabel} htmlFor="reg-tel">
              Téléphone
            </label>
            <input
              id="reg-tel"
              type="tel"
              className={styles.formInput}
              placeholder="+224 6XX XXX XXX"
            />

            <label className={styles.formLabel} htmlFor="reg-password">
              Mot de passe
            </label>
            <input
              id="reg-password"
              type="password"
              className={styles.formInput}
              placeholder="Minimum 8 caractères"
              required
            />

            <div className="form-check mb-4">
              <input className="form-check-input" type="checkbox" id="cgu" required />
              <label className="form-check-label text-secondary small" htmlFor="cgu">
                J&apos;accepte les{" "}
                <span style={{ color: "var(--mf-orange)", fontWeight: 600 }}>
                  conditions d&apos;utilisation
                </span>{" "}
                de Marché Fooly.
              </label>
            </div>

            <button type="submit" className="btn btn-warning fw-bold w-100">
              <i className="bi bi-person-check me-1" aria-hidden="true"></i>
              Créer mon compte
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
