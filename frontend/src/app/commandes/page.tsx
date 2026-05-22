/**
 * Route: app/commandes/page
 *
 * Rôle du fichier :
 *   Page « Mes commandes ». Protégée côté serveur : un visiteur non
 *   connecté est redirigé vers /mon-compte.
 *
 * Sécurité :
 *   - L'état de connexion est vérifié côté serveur via getCurrentUser()
 *     (cookie httpOnly + validation backend). On ne fait jamais
 *     confiance au navigateur.
 *   - redirect() est appelé HORS de tout try/catch (il lève
 *     volontairement une exception NEXT_REDIRECT).
 *   - `dynamic = "force-dynamic"` : la page dépend du cookie de session.
 *
 * Limite connue :
 *   Les commandes affichées proviennent encore de données statiques
 *   (src/data/orders.ts). La connexion à l'API commandes backend est
 *   prévue pour un bloc ultérieur.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import OrderCard from "@/components/orders/OrderCard";
import OrdersToolbar from "@/components/orders/OrdersToolbar";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { orders, statusLabel, statusClass } from "@/data/orders";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/orders.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Mes commandes",
  description:
    "Suivez l'état de vos commandes sur Marché Fooly et retrouvez l'historique de vos achats locaux à Sangarédi.",
};

// La page dépend du cookie de session : rendu dynamique obligatoire.
export const dynamic = "force-dynamic";

export default async function CommandesPage() {
  // Protection serveur : les visiteurs non connectés sont redirigés.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/mon-compte");
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const doneCount = orders.filter((o) => o.status === "done").length;
  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length;

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.ordersHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>
                  Accueil
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/mon-compte" className={styles.breadcrumbLink}>
                  Mon compte
                </Link>
              </li>
              <li
                className={`breadcrumb-item active ${styles.breadcrumbCurrent}`}
                aria-current="page"
              >
                Commandes
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-bag" aria-hidden="true"></i>
                Historique d&apos;achats
              </span>
              <h1 className={`${styles.ordersTitle} mb-3`}>Mes commandes</h1>
              <p className="fs-5 mb-0" style={{ color: "rgba(255,255,255,0.75)" }}>
                Suivez l&apos;état de vos commandes et retrouvez vos achats passés auprès des vendeurs locaux.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link href="/boutique" className="btn btn-outline-light">
                <i className="bi bi-bag-plus me-1" aria-hidden="true"></i>
                Nouvelle commande
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Orders content ────────────────────────────────────────── */}
      <section className={styles.ordersPage}>
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* Left column – order list */}
            <div className="col-lg-9">
              <OrdersToolbar count={orders.length} />

              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>

            {/* Right column – stats */}
            <div className="col-lg-3">
              <div className={styles.statCard}>
                <span className={styles.statValue}>{orders.length}</span>
                <span className={styles.statLabel}>Commandes total</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statValue}>{doneCount}</span>
                <span className={styles.statLabel}>Livrées</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statValue}>{pendingCount}</span>
                <span className={styles.statLabel}>En cours</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statValue}>
                  {formatPrice(totalSpent, "GNF")}
                </span>
                <span className={styles.statLabel}>Total dépensé</span>
              </div>

              {/* Status legend */}
              <div className="bg-white rounded-3 shadow-sm p-3 mt-2">
                <p className="fw-bold mb-2" style={{ fontSize: "0.875rem" }}>
                  Légende des statuts
                </p>
                {Object.entries(statusLabel).map(([key, label]) => (
                  <div key={key} className="d-flex align-items-center gap-2 mb-1">
                    <span className={`badge bg-${statusClass[key]} rounded-pill`} style={{ fontSize: "0.7rem" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <Link href="/boutique" className="btn btn-warning fw-bold w-100 mt-3">
                <i className="bi bi-bag me-1" aria-hidden="true"></i>
                Acheter à nouveau
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <section className="py-5" style={{ background: "var(--mf-light)" }}>
        <div className="container">
          <NewsletterBanner />
        </div>
      </section>
    </>
  );
}
