/**
 * Route UI: app/vendeur/commandes/loading
 *
 * Rôle du fichier :
 *   Squelette de chargement de la liste des commandes vendeur.
 *   Server Component, sans interactivité.
 *
 * Où il est utilisé :
 *   - Convention App Router : enveloppe automatique du segment via Suspense.
 *
 * Note pour GitHub Copilot :
 *   - Squelette de tableau ; classes `placeholder*` Bootstrap 5.
 */

export default function VendeurCommandesLoading() {
  const rows = Array.from({ length: 5 });

  return (
    <section className="container py-5" aria-busy="true">
      <p className="text-secondary fw-semibold mb-4">
        <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
        Chargement de vos commandes…
      </p>

      <div className="bg-white rounded-3 shadow-sm p-3 placeholder-glow" aria-hidden="true">
        {rows.map((_, index) => (
          <div
            key={index}
            className="d-flex justify-content-between py-3 border-bottom"
          >
            <span className="placeholder col-3"></span>
            <span className="placeholder col-2"></span>
            <span className="placeholder col-2"></span>
          </div>
        ))}
      </div>
    </section>
  );
}
