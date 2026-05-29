/**
 * Route UI: app/admin/loading
 *
 * Rôle du fichier :
 *   Squelette de chargement de la vue d'ensemble admin. Server Component.
 *
 * Où il est utilisé :
 *   - Convention App Router : enveloppe automatique du segment via Suspense.
 *
 * Note pour GitHub Copilot :
 *   - Squelette de 4 cartes ; classes `placeholder*` Bootstrap 5.
 */

export default function AdminLoading() {
  const cards = Array.from({ length: 4 });

  return (
    <section className="container py-5" aria-busy="true">
      <p className="text-secondary fw-semibold mb-4">
        <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
        Chargement de l&apos;administration…
      </p>

      <div className="row g-3" aria-hidden="true">
        {cards.map((_, index) => (
          <div key={index} className="col-sm-6 col-lg-3">
            <div className="bg-white rounded-3 shadow-sm p-4 placeholder-glow">
              <span className="placeholder col-5 mb-3 d-block"></span>
              <span className="placeholder col-4 mb-2 d-block"></span>
              <span className="placeholder col-7 d-block"></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
