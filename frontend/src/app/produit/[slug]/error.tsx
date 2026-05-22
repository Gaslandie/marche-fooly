/**
 * Route UI: app/produit/[slug]/error
 *
 * Rôle du fichier :
 *   UI d'erreur de la page de détail produit. Si `page.tsx` lève une erreur
 *   (API injoignable, réponse HTTP non OK...), Next.js affiche ce composant
 *   à la place de la page, sans casser le reste du site.
 *
 *   Important : ceci ne couvre PAS le cas « produit introuvable ». Un produit
 *   absent déclenche `notFound()` dans `page.tsx`, géré par la page 404 — pas
 *   par cette Error Boundary.
 *
 * Où il est utilisé :
 *   - Convention App Router : tout fichier `error.tsx` enveloppe le segment
 *     dans une React Error Boundary. Aucun import manuel n'est nécessaire.
 *
 * Prérequis / infos utiles :
 *   - DOIT être un Client Component ("use client") : une Error Boundary
 *     React ne peut pas être un Server Component.
 *   - Props fournies par Next.js : `error` (objet Error) et `reset`
 *     (relance le rendu du segment).
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";

type ProduitErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProduitError({ error, reset }: ProduitErrorProps) {
  useEffect(() => {
    console.error("Erreur de chargement du produit :", error);
  }, [error]);

  return (
    <section className="container py-5">
      <div className="text-center mx-auto" style={{ maxWidth: "520px" }}>
        <i
          className="bi bi-wifi-off text-warning"
          style={{ fontSize: "3rem" }}
          aria-hidden="true"
        ></i>
        <h1 className="h3 fw-bold mt-3">Impossible d&apos;afficher ce produit</h1>
        <p className="text-secondary">
          Une erreur est survenue pendant le chargement du produit.
          Vérifiez votre connexion, puis réessayez.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <button type="button" className="btn btn-dark" onClick={() => reset()}>
            <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
            Réessayer
          </button>
          <Link href="/boutique" className="btn btn-outline-dark">
            Retour à la boutique
          </Link>
        </div>
      </div>
    </section>
  );
}
