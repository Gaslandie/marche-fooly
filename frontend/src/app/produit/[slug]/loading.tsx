/**
 * Route UI: app/produit/[slug]/loading
 *
 * Rôle du fichier :
 *   UI de chargement de la page de détail produit. Next.js (App Router)
 *   l'affiche automatiquement pendant que `page.tsx` attend la réponse de
 *   l'API (`getProductBySlug()`).
 *
 * Où il est utilisé :
 *   - Convention App Router : tout fichier `loading.tsx` enveloppe le
 *     `page.tsx` du même segment dans une frontière React <Suspense>.
 *     Aucun import manuel n'est nécessaire.
 *
 * Prérequis / infos utiles :
 *   - Server Component (aucune interactivité, pas de "use client").
 *   - Ne reçoit aucune prop.
 *   - Squelette en deux colonnes (image + informations) pour rappeler la
 *     mise en page réelle du détail produit.
 *   - Classes `placeholder*` issues de Bootstrap 5 (chargé globalement).
 */

export default function ProduitLoading() {
  return (
    <section className="container py-5" aria-busy="true">
      <p className="text-secondary fw-semibold mb-4">
        <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
        Chargement du produit…
      </p>

      <div className="row g-4" aria-hidden="true">
        <div className="col-lg-6">
          <span
            className="placeholder col-12 d-block rounded-3 placeholder-glow"
            style={{ height: "320px" }}
          ></span>
        </div>

        <div className="col-lg-6 placeholder-glow">
          <span className="placeholder col-8 mb-3 d-block"></span>
          <span className="placeholder col-4 mb-4 d-block"></span>
          <span className="placeholder col-12 mb-2 d-block"></span>
          <span className="placeholder col-10 mb-2 d-block"></span>
          <span className="placeholder col-6 mb-4 d-block"></span>
          <span
            className="placeholder col-5 d-block rounded-2"
            style={{ height: "44px" }}
          ></span>
        </div>
      </div>
    </section>
  );
}
