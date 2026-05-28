/**
 * Route: app/commandes/page
 *
 * Rôle du fichier :
 *   Page « Mes commandes ». Protégée côté serveur (redirect si non
 *   connecté). Récupère les commandes réelles du client via getMyOrders()
 *   (cookie httpOnly + backend) et les confie à <OrdersHistory> (Client)
 *   pour la recherche/le filtre. Stats calculées côté serveur sur les
 *   commandes récupérées.
 *
 * Sécurité :
 *   - `getCurrentUser()` valide la session ; `redirect("/mon-compte")`
 *     hors try/catch si non connecté.
 *   - `getMyOrders()` renvoie uniquement les commandes du client
 *     (ownership backend). Le JWT n'est jamais exposé au navigateur.
 *   - `dynamic = "force-dynamic"` : dépend du cookie de session.
 *
 * Note pour GitHub Copilot :
 *   - `getMyOrders` -> null = échec backend/réseau : on affiche un état
 *     d'erreur léger (loading.tsx/error.tsx complètent au bloc suivant).
 *   - Limite de fetch volontairement large (50) pour le MVP ; la
 *     pagination UI n'est pas encore branchée.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import OrdersHistory from "@/components/orders/OrdersHistory";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { getCurrentUser } from "@/lib/auth";
import { getMyOrders } from "@/lib/orders";
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
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

const IN_PROGRESS_STATUSES = ["pending", "confirmed", "preparing", "shipped"];

export default async function CommandesPage() {
  // Protection serveur : les visiteurs non connectés sont redirigés.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/mon-compte");
  }

  const result = await getMyOrders({ limit: 50 });
  const loadError = result === null;
  const orders = result?.items ?? [];

  // Stats calculées sur les commandes récupérées.
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const inProgressCount = orders.filter((o) =>
    IN_PROGRESS_STATUSES.includes(o.status),
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
              {loadError ? (
                <div className="bg-white rounded-3 shadow-sm p-5 text-center">
                  <i
                    className="bi bi-wifi-off d-block mb-3 text-warning"
                    style={{ fontSize: "2.5rem" }}
                    aria-hidden="true"
                  ></i>
                  <h2 className="h5 fw-bold">
                    Impossible de charger vos commandes
                  </h2>
                  <p className="text-secondary mb-4">
                    Une erreur est survenue. Vérifiez votre connexion, puis
                    réessayez.
                  </p>
                  <Link href="/commandes" className="btn btn-dark">
                    <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
                    Réessayer
                  </Link>
                </div>
              ) : (
                <OrdersHistory orders={orders} />
              )}
            </div>

            {/* Right column – stats */}
            <div className="col-lg-3">
              <div className={styles.statCard}>
                <span className={styles.statValue}>{orders.length}</span>
                <span className={styles.statLabel}>Commandes total</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statValue}>{deliveredCount}</span>
                <span className={styles.statLabel}>Livrées</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statValue}>{inProgressCount}</span>
                <span className={styles.statLabel}>En cours</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statValue}>
                  {formatPrice(totalSpent, "GNF")}
                </span>
                <span className={styles.statLabel}>Total dépensé</span>
              </div>

              {/* Légende des statuts */}
              <div className="bg-white rounded-3 shadow-sm p-3 mt-2">
                <p className="fw-bold mb-2" style={{ fontSize: "0.875rem" }}>
                  Légende des statuts
                </p>
                {Object.entries(ORDER_STATUS_LABEL).map(([key, label]) => (
                  <div key={key} className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className={`badge bg-${ORDER_STATUS_CLASS[key]} rounded-pill`}
                      style={{ fontSize: "0.7rem" }}
                    >
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
