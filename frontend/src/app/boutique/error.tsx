/**
 * Route UI: app/boutique/error
 *
 * Rôle du fichier :
 *   UI d'erreur de la page /boutique. Si `app/boutique/page.tsx` lève une
 *   erreur (API produits injoignable, réponse HTTP non OK...), Next.js
 *   affiche ce composant à la place de la page, sans casser le reste du site.
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
 *   - L'erreur est journalisée en console via useEffect (utile en dev).
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";

type BoutiqueErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function BoutiqueError({ error, reset }: BoutiqueErrorProps) {
  useEffect(() => {
    console.error("Erreur de chargement de la boutique :", error);
  }, [error]);

  return (
    <section className="container py-5">
      <div className="text-center mx-auto" style={{ maxWidth: "520px" }}>
        <i
          className="bi bi-wifi-off text-warning"
          style={{ fontSize: "3rem" }}
          aria-hidden="true"
        ></i>
        <h1 className="h3 fw-bold mt-3">Impossible d&apos;afficher la boutique</h1>
        <p className="text-secondary">
          Une erreur est survenue pendant le chargement des produits.
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
