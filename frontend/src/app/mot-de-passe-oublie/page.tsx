/**
 * Route: app/mot-de-passe-oublie/page
 *
 * Rôle du fichier :
 *   Page « Mot de passe oublié » : l'utilisateur saisit son email pour
 *   recevoir un lien de réinitialisation (valable 1 heure).
 *   Toute la logique est dans ForgotPasswordForm (Client Component).
 *
 * Accès :
 *   - Lien « Mot de passe oublié ? » du formulaire de connexion
 *     (/mon-compte, composant AuthTabs).
 */

import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/account/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description:
    "Recevez un lien par email pour réinitialiser le mot de passe de votre compte Marché Fooly.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <section className="py-5" style={{ background: "var(--mf-light)" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </section>
  );
}
