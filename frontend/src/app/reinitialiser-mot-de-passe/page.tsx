/**
 * Route: app/reinitialiser-mot-de-passe/page
 *
 * Rôle du fichier :
 *   Page ouverte depuis le lien reçu par email
 *   (`/reinitialiser-mot-de-passe?token=...`) : définition du nouveau
 *   mot de passe. La logique est dans ResetPasswordForm (Client
 *   Component), enveloppé dans <Suspense> car il lit useSearchParams
 *   (exigence Next.js au build pour les pages pré-rendues).
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordForm from "@/components/account/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe",
  description:
    "Choisissez un nouveau mot de passe pour votre compte Marché Fooly.",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="py-5" style={{ background: "var(--mf-light)" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
