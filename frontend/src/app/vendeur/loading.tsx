/**
 * Route UI: app/vendeur/loading
 *
 * Rôle du fichier :
 *   Squelette de chargement du dashboard vendeur (pendant les fetchs
 *   profil/produits/commandes). Server Component, sans interactivité.
 *
 * Où il est utilisé :
 *   - Convention App Router : enveloppe automatique du segment via Suspense.
 *
 * Note pour GitHub Copilot :
 *   - Squelette : bandeau de stats + tableau produits. Classes
 *     `placeholder*` issues de Bootstrap 5.
 */

export default function VendeurLoading() {
  const stats = Array.from({ length: 5 });
  const rows = Array.from({ length: 4 });

  return (
    <section className="container py-5" aria-busy="true">
      <p className="text-secondary fw-semibold mb-4">
        <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
        Chargement de votre espace vendeur…
      </p>

      <div className="row g-3 mb-4" aria-hidden="true">
        {stats.map((_, index) => (
          <div key={index} className="col-6 col-lg">
            <div className="bg-white rounded-3 shadow-sm p-3 text-center placeholder-glow">
              <span className="placeholder col-6 mb-2 d-block mx-auto"></span>
              <span className="placeholder col-8 d-block mx-auto"></span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3 shadow-sm p-3 placeholder-glow" aria-hidden="true">
        {rows.map((_, index) => (
          <div
            key={index}
            className="d-flex justify-content-between py-3 border-bottom"
          >
            <span className="placeholder col-4"></span>
            <span className="placeholder col-2"></span>
          </div>
        ))}
      </div>
    </section>
  );
}
