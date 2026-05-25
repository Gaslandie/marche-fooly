/**
 * Route UI: app/commande/[reference]/loading
 *
 * Rôle du fichier :
 *   UI de chargement pendant la récupération de la commande
 *   (lib/orders -> backend). Server Component, sans interactivité.
 *
 * Où il est utilisé :
 *   - Convention App Router : enveloppe automatique du segment via Suspense.
 *
 * Note pour GitHub Copilot :
 *   - Squelette en deux colonnes (récap articles + détails latéraux)
 *     pour annoncer la mise en page finale.
 *   - Classes `placeholder*` issues de Bootstrap 5 (chargé globalement).
 */

export default function CommandeLoading() {
  const itemSkeletons = Array.from({ length: 3 });

  return (
    <section className="container py-5" aria-busy="true">
      <p className="text-secondary fw-semibold mb-4">
        <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
        Chargement de votre commande…
      </p>

      <div className="row g-4" aria-hidden="true">
        <div className="col-lg-8">
          <div className="bg-white rounded-3 shadow-sm p-4 placeholder-glow">
            <span className="placeholder col-5 mb-3 d-block"></span>
            {itemSkeletons.map((_, index) => (
              <div key={index} className="py-3 border-bottom">
                <span className="placeholder col-8 mb-2 d-block"></span>
                <span className="placeholder col-4 d-block"></span>
              </div>
            ))}
          </div>
        </div>
        <div className="col-lg-4 placeholder-glow">
          <div className="bg-white rounded-3 shadow-sm p-4 mb-3">
            <span className="placeholder col-6 mb-2 d-block"></span>
            <span className="placeholder col-9 d-block"></span>
          </div>
          <div className="bg-white rounded-3 shadow-sm p-4 mb-3">
            <span className="placeholder col-6 mb-2 d-block"></span>
            <span className="placeholder col-10 d-block"></span>
          </div>
        </div>
      </div>
    </section>
  );
}
