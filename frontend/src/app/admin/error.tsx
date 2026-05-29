/**
 * Route UI: app/admin/error
 *
 * Rôle du fichier :
 *   Error Boundary de l'espace admin. Affiché si une page admin lève une
 *   exception inattendue.
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

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Erreur de l'espace admin :", error);
  }, [error]);

  return (
    <section className="container py-5">
      <div className="text-center mx-auto" style={{ maxWidth: "520px" }}>
        <i
          className="bi bi-wifi-off text-warning"
          style={{ fontSize: "3rem" }}
          aria-hidden="true"
        ></i>
        <h1 className="h3 fw-bold mt-3">Impossible d&apos;afficher l&apos;administration</h1>
        <p className="text-secondary">
          Une erreur est survenue. Vérifiez votre connexion, puis réessayez.
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
