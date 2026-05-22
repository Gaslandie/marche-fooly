/**
 * Route UI: app/boutique/loading
 *
 * Rôle du fichier :
 *   UI de chargement de la page /boutique. Next.js (App Router) l'affiche
 *   automatiquement pendant que `app/boutique/page.tsx` attend la réponse
 *   de l'API produits (`getProducts()`).
 *
 * Où il est utilisé :
 *   - Convention App Router : tout fichier `loading.tsx` enveloppe le
 *     `page.tsx` du même segment dans une frontière React <Suspense>.
 *     Aucun import manuel n'est nécessaire.
 *
 * Prérequis / infos utiles :
 *   - Server Component (aucune interactivité, pas de "use client").
 *   - Ne reçoit aucune prop.
 *   - Squelette en deux colonnes (filtres + grille produits) pour rappeler
 *     la mise en page réelle de la boutique.
 *   - Les classes `placeholder*` viennent de Bootstrap 5 (chargé globalement).
 */

export default function BoutiqueLoading() {
  const skeletonCards = Array.from({ length: 9 });

  return (
    <section className="container py-5" aria-busy="true">
      <p className="text-secondary fw-semibold mb-4">
        <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
        Chargement des produits Marché Fooly…
      </p>

      <div className="row g-4" aria-hidden="true">
        <div className="col-lg-3">
          <div className="border rounded-3 p-3 placeholder-glow">
            <span className="placeholder col-7 mb-3 d-block"></span>
            <span className="placeholder col-12 mb-2 d-block"></span>
            <span className="placeholder col-10 mb-2 d-block"></span>
            <span className="placeholder col-8 d-block"></span>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="row g-4">
            {skeletonCards.map((_, index) => (
              <div key={index} className="col-sm-6 col-xl-4">
                <div className="border rounded-3 p-3 placeholder-glow">
                  <span
                    className="placeholder col-12 d-block mb-3"
                    style={{ height: "140px" }}
                  ></span>
                  <span className="placeholder col-9 mb-2 d-block"></span>
                  <span className="placeholder col-5 d-block"></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
