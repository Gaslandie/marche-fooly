/**
 * Route UI: app/categories/loading
 *
 * Rôle du fichier :
 *   UI de chargement de la page /categories. Next.js (App Router) affiche
 *   automatiquement ce composant pendant que `app/categories/page.tsx`
 *   attend la réponse de l'API (`getCategories()`).
 *
 * Où il est utilisé :
 *   - Convention App Router : tout fichier `loading.tsx` enveloppe le
 *     `page.tsx` du même segment dans une frontière React <Suspense>.
 *     Aucun import manuel n'est nécessaire.
 *
 * Prérequis / infos utiles :
 *   - C'est un Server Component (aucune interactivité, pas de "use client").
 *   - Il ne reçoit aucune prop.
 *   - On affiche un squelette « parlant » (cartes grisées animées) plutôt
 *     qu'un simple texte : l'utilisateur comprend que le contenu arrive.
 *   - Les classes `placeholder*` viennent de Bootstrap 5 (déjà chargé
 *     globalement dans le projet).
 */

export default function CategoriesLoading() {
  const skeletonCards = Array.from({ length: 8 });

  return (
    <section className="container py-5" aria-busy="true">
      <p className="text-secondary fw-semibold mb-4">
        <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
        Chargement des catégories Marché Fooly…
      </p>

      <div className="row g-3" aria-hidden="true">
        {skeletonCards.map((_, index) => (
          <div key={index} className="col-md-6 col-lg-4">
            <div className="border rounded-3 p-3 placeholder-glow">
              <span className="placeholder col-5 mb-2 d-block"></span>
              <span className="placeholder col-9 mb-2 d-block"></span>
              <span className="placeholder col-7 d-block"></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
