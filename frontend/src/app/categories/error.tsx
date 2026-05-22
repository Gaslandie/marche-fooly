/**
 * Route UI: app/categories/error
 *
 * Rôle du fichier :
 *   UI d'erreur de la page /categories. Si `app/categories/page.tsx` lève
 *   une erreur (API injoignable, réponse HTTP non OK...), Next.js affiche
 *   ce composant à la place de la page, sans casser le reste du site.
 *
 * Où il est utilisé :
 *   - Convention App Router : tout fichier `error.tsx` enveloppe le segment
 *     dans une React Error Boundary. Aucun import manuel n'est nécessaire.
 *
 * Prérequis / infos utiles :
 *   - DOIT être un Client Component ("use client") : une Error Boundary
 *     React ne peut pas être un Server Component.
 *   - Props fournies par Next.js :
 *       - `error` : l'objet Error (avec un éventuel `digest`).
 *       - `reset` : relance le rendu du segment (nouvelle tentative).
 *   - On journalise l'erreur en console via useEffect (utile en dev ;
 *     un vrai service de monitoring pourra être branché plus tard).
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";

type CategoriesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CategoriesError({ error, reset }: CategoriesErrorProps) {
  useEffect(() => {
    console.error("Erreur de chargement des catégories :", error);
  }, [error]);

  return (
    <section className="container py-5">
      <div className="text-center mx-auto" style={{ maxWidth: "520px" }}>
        <i
          className="bi bi-wifi-off text-warning"
          style={{ fontSize: "3rem" }}
          aria-hidden="true"
        ></i>
        <h1 className="h3 fw-bold mt-3">Impossible d&apos;afficher les catégories</h1>
        <p className="text-secondary">
          Une erreur est survenue pendant le chargement des catégories.
          Vérifiez votre connexion, puis réessayez.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <button type="button" className="btn btn-dark" onClick={() => reset()}>
            <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
            Réessayer
          </button>
          <Link href="/" className="btn btn-outline-dark">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
