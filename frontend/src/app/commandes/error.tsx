/**
 * Route UI: app/commandes/error
 *
 * Rôle du fichier :
 *   Error Boundary de la page /commandes. Affiché si `page.tsx` lève une
 *   exception inattendue. Les échecs « normaux » (backend injoignable)
 *   sont déjà gérés en douceur dans la page via un état d'erreur inline
 *   (getMyOrders -> null) : ce fichier couvre les exceptions non prévues.
 *
 * Où il est utilisé :
 *   - Convention App Router : enveloppe le segment dans une React Error
 *     Boundary. Aucun import manuel nécessaire.
 *
 * Prérequis :
 *   - DOIT être un Client Component (Error Boundary React).
 *   - Props standard Next : `error` et `reset`.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CommandesError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Erreur de chargement des commandes :", error);
  }, [error]);

  return (
    <section className="container py-5">
      <div className="text-center mx-auto" style={{ maxWidth: "520px" }}>
        <i
          className="bi bi-wifi-off text-warning"
          style={{ fontSize: "3rem" }}
          aria-hidden="true"
        ></i>
        <h1 className="h3 fw-bold mt-3">
          Impossible d&apos;afficher vos commandes
        </h1>
        <p className="text-secondary">
          Une erreur est survenue pendant le chargement de votre historique.
          Vérifiez votre connexion, puis réessayez.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <button type="button" className="btn btn-dark" onClick={() => reset()}>
            <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
            Réessayer
          </button>
          <Link href="/mon-compte" className="btn btn-outline-dark">
            Retour à mon compte
          </Link>
        </div>
      </div>
    </section>
  );
}
