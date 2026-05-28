/**
 * Route UI: app/commandes/loading
 *
 * Rôle du fichier :
 *   UI de chargement de la page /commandes. Next.js (App Router) l'affiche
 *   automatiquement pendant que `page.tsx` attend la réponse de l'API
 *   (`getMyOrders()`).
 *
 * Où il est utilisé :
 *   - Convention App Router : enveloppe automatique du segment via Suspense.
 *
 * Prérequis / infos utiles :
 *   - Server Component (aucune interactivité, pas de "use client").
 *   - Squelette en deux colonnes (liste de commandes + stats latérales)
 *     pour rappeler la mise en page réelle.
 *   - Classes `placeholder*` issues de Bootstrap 5 (chargé globalement).
 */

export default function CommandesLoading() {
  const cardSkeletons = Array.from({ length: 3 });
  const statSkeletons = Array.from({ length: 4 });

  return (
    <section className="container py-5" aria-busy="true">
      <p className="text-secondary fw-semibold mb-4">
        <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
        Chargement de vos commandes…
      </p>

      <div className="row g-4" aria-hidden="true">
        {/* Liste de commandes */}
        <div className="col-lg-9">
          {cardSkeletons.map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-3 shadow-sm p-4 mb-3 placeholder-glow"
            >
              <div className="d-flex justify-content-between mb-3">
                <span className="placeholder col-4"></span>
                <span className="placeholder col-2"></span>
              </div>
              <span className="placeholder col-9 mb-2 d-block"></span>
              <span className="placeholder col-7 mb-3 d-block"></span>
              <span className="placeholder col-5 d-block"></span>
            </div>
          ))}
        </div>

        {/* Stats latérales */}
        <div className="col-lg-3 placeholder-glow">
          {statSkeletons.map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-3 shadow-sm p-3 mb-2"
            >
              <span className="placeholder col-6 mb-2 d-block"></span>
              <span className="placeholder col-8 d-block"></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
