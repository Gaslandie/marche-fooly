/**
 * Route: app/vendeur/page
 *
 * Rôle du fichier :
 *   Dashboard vendeur. Server Component protégé qui aiguille selon
 *   l'état du compte/profil vendeur :
 *     - non connecté            -> redirect("/mon-compte")
 *     - connecté sans profil    -> CTA « Devenir vendeur »
 *     - profil pending          -> écran « candidature en cours »
 *     - profil rejected         -> message refus
 *     - profil suspended        -> message suspension
 *     - profil approved         -> dashboard (stats + liste produits)
 *
 * Sécurité (IMPORTANT) :
 *   - On NE se base JAMAIS uniquement sur `user.role` : on revalide
 *     systématiquement `sellerProfile.status` côté serveur via
 *     getMySellerProfile(). Le backend reste la source de vérité.
 *   - `dynamic = "force-dynamic"` : dépend du cookie de session.
 *   - JWT jamais exposé (fetch serveur via cookie httpOnly).
 *
 * Note pour GitHub Copilot :
 *   - La liste produits vient de getSellerProducts(profile.slug)
 *     (uniquement active/out_of_stock — limite MVP).
 *   - Les liens « Ajouter »/« Modifier » mènent aux pages du bloc suivant.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SellerProductList from "@/components/seller/SellerProductList";
import {
  getMySellerProfile,
  getSellerOrders,
  getSellerProducts,
} from "@/lib/seller";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/utils/formatPrice";

export const metadata: Metadata = {
  title: "Espace vendeur",
  description: "Gérez vos produits et suivez vos commandes sur Marché Fooly.",
};

export const dynamic = "force-dynamic";

/** Petit cadre centré réutilisé pour les états non-approved. */
function InfoScreen({
  icon,
  iconColor,
  title,
  children,
}: {
  icon: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container py-5">
      <div className="text-center mx-auto" style={{ maxWidth: "560px" }}>
        <i
          className={`${icon} d-block mb-3`}
          style={{ fontSize: "3rem", color: iconColor }}
          aria-hidden="true"
        ></i>
        <h1 className="h3 fw-bold mb-2">{title}</h1>
        {children}
      </div>
    </section>
  );
}

export default async function VendeurPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/mon-compte");
  }

  const profile = await getMySellerProfile();

  // Connecté mais aucun profil vendeur.
  if (!profile) {
    return (
      <InfoScreen
        icon="bi bi-shop"
        iconColor="var(--mf-orange)"
        title="Devenez vendeur sur Marché Fooly"
      >
        <p className="text-secondary mb-4">
          Vous n&apos;avez pas encore de boutique. Déposez votre candidature
          pour vendre vos produits auprès des clients de Sangarédi.
        </p>
        <Link href="/devenir-vendeur" className="btn btn-warning fw-bold">
          <i className="bi bi-rocket-takeoff me-1" aria-hidden="true"></i>
          Devenir vendeur
        </Link>
      </InfoScreen>
    );
  }

  if (profile.status === "pending") {
    return (
      <InfoScreen
        icon="bi bi-hourglass-split"
        iconColor="var(--mf-orange)"
        title="Candidature en cours d'examen"
      >
        <p className="text-secondary mb-4">
          Votre boutique <strong>{profile.storeName}</strong> est en attente de
          validation par notre équipe. Vous pourrez gérer vos produits dès
          qu&apos;elle sera approuvée.
        </p>
        <Link href="/mon-compte" className="btn btn-outline-dark">
          Retour à mon compte
        </Link>
      </InfoScreen>
    );
  }

  if (profile.status === "rejected") {
    return (
      <InfoScreen
        icon="bi bi-x-octagon"
        iconColor="#dc3545"
        title="Candidature non retenue"
      >
        <p className="text-secondary mb-4">
          Votre candidature vendeur n&apos;a pas été acceptée. Pour en savoir
          plus ou redéposer un dossier, contactez notre support.
        </p>
        <Link href="/contact" className="btn btn-outline-dark">
          Contacter le support
        </Link>
      </InfoScreen>
    );
  }

  if (profile.status === "suspended") {
    return (
      <InfoScreen
        icon="bi bi-pause-circle"
        iconColor="#dc3545"
        title="Boutique suspendue"
      >
        <p className="text-secondary mb-4">
          Votre boutique <strong>{profile.storeName}</strong> est actuellement
          suspendue. Contactez le support pour régulariser votre situation.
        </p>
        <Link href="/contact" className="btn btn-outline-dark">
          Contacter le support
        </Link>
      </InfoScreen>
    );
  }

  // ── Profil approved : dashboard complet ──────────────────────────
  const products = await getSellerProducts(profile.slug);
  const ordersResult = await getSellerOrders();
  const orders = ordersResult?.items ?? [];

  const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
  const ordersReceived = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const revenueDelivered = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    { icon: "bi bi-box-seam", label: "Produits", value: products.length },
    { icon: "bi bi-stack", label: "Stock total", value: totalStock },
    { icon: "bi bi-receipt", label: "Commandes reçues", value: ordersReceived },
    { icon: "bi bi-hourglass", label: "En attente", value: pendingOrders },
    {
      icon: "bi bi-cash-stack",
      label: "CA livré",
      value: formatPrice(revenueDelivered, "GNF"),
    },
  ];

  return (
    <section className="container py-5">
      {/* En-tête */}
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/mon-compte">Mon compte</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Espace vendeur
          </li>
        </ol>
      </nav>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <span
            className="fw-bold"
            style={{ color: "var(--mf-orange)", fontSize: "0.875rem" }}
          >
            <i className="bi bi-shop me-1" aria-hidden="true"></i>
            {profile.storeName}
          </span>
          <h1 className="h3 fw-bold mb-0">Espace vendeur</h1>
        </div>
        <Link href="/vendeur/produits/nouveau" className="btn btn-warning fw-bold">
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
          Ajouter un produit
        </Link>
      </div>

      {/* Statistiques */}
      <div className="row g-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="col-6 col-lg">
            <div className="bg-white rounded-3 shadow-sm p-3 h-100 text-center">
              <i
                className={`${s.icon} fs-3 mb-2 d-block`}
                style={{ color: "var(--mf-orange)" }}
                aria-hidden="true"
              ></i>
              <div className="fw-bold fs-5">{s.value}</div>
              <div className="text-secondary small">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Liste des produits */}
      <h2 className="h5 fw-bold mb-3">Mes produits</h2>
      <SellerProductList products={products} />

      {!ordersResult && (
        <p className="text-secondary small mt-3">
          <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
          Les statistiques de commandes n&apos;ont pas pu être chargées.
        </p>
      )}
    </section>
  );
}
