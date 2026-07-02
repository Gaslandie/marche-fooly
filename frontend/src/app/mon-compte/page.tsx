/**
 * Route: app/mon-compte/page
 *
 * Rôle du fichier :
 *   Page « Mon compte ». Protégée côté serveur :
 *     - utilisateur NON connecté  -> affiche AuthTabs (connexion/inscription) ;
 *     - utilisateur connecté      -> affiche son tableau de bord réel.
 *
 * Sécurité :
 *   - L'état de connexion est déterminé côté serveur via getCurrentUser()
 *     (lecture du cookie httpOnly + validation backend). On ne fait
 *     jamais confiance au navigateur.
 *   - `dynamic = "force-dynamic"` : la page dépend du cookie de session,
 *     elle ne doit pas être pré-rendue / mise en cache.
 *
 * Limites connues :
 *   - Boutons « Modifier mes informations » / « Changer le mot de passe »
 *     et les préférences de notification : non fonctionnels pour l'instant.
 */

import type { Metadata } from "next";
import Link from "next/link";
import AuthTabs from "@/components/account/AuthTabs";
import AccountSidebar from "@/components/account/AccountSidebar";
import { getCurrentUser } from "@/lib/auth";
import { getMyFavoriteCount } from "@/lib/favorites";
import { getMyOrderStats } from "@/lib/orders";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/account.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Mon compte",
  description:
    "Gérez votre profil, consultez vos commandes et personnalisez vos préférences sur Marché Fooly.",
};

// La page dépend du cookie de session : rendu dynamique obligatoire.
export const dynamic = "force-dynamic";

const NOTIF_SETTINGS = [
  { label: "Nouvelles commandes", desc: "Recevez une alerte à chaque commande passée." },
  { label: "Informations Marché Fooly", desc: "Actualités utiles sur votre compte et la marketplace." },
  { label: "Mises à jour de livraison", desc: "Notifications dès que votre colis évolue." },
];

export default async function MonComptePage() {
  // Vérification de session côté serveur (cookie httpOnly + backend).
  const user = await getCurrentUser();
  let orderStats: Awaited<ReturnType<typeof getMyOrderStats>> = null;
  let favoriteCount = 0;
  if (user) {
    [orderStats, favoriteCount] = await Promise.all([
      getMyOrderStats(),
      getMyFavoriteCount(),
    ]);
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.accountHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>
                  Accueil
                </Link>
              </li>
              <li
                className={`breadcrumb-item active ${styles.breadcrumbCurrent}`}
                aria-current="page"
              >
                Mon compte
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-person-circle" aria-hidden="true"></i>
                Espace personnel
              </span>
              <h1 className={`${styles.accountTitle} mb-3`}>
                {user ? `Bonjour ${user.firstName}` : "Mon compte"}
              </h1>
              <p className="fs-5 mb-0" style={{ color: "rgba(255,255,255,0.75)" }}>
                {user
                  ? "Gérez votre profil, suivez vos commandes et personnalisez votre expérience Marché Fooly."
                  : "Connectez-vous ou créez un compte pour suivre vos commandes et vos favoris."}
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link href="/boutique" className="btn btn-outline-light">
                <i className="bi bi-bag me-1" aria-hidden="true"></i>
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Account content ───────────────────────────────────────── */}
      <section className={styles.accountPage}>
        <div className="container">
          {user ? (
            <div className="row g-4 align-items-start">
              {/* Left column – sidebar */}
              <div className="col-lg-3">
                <AccountSidebar user={user} />
              </div>

              {/* Right column – panels */}
              <div className="col-lg-9">
                {/* Profile info – real data */}
                <div className={styles.infoCard}>
                  <h2 className={styles.infoCardTitle}>Informations personnelles</h2>
                  {[
                    { label: "Prénom", value: user.firstName },
                    { label: "Nom", value: user.lastName },
                    { label: "E-mail", value: user.email },
                    { label: "Téléphone", value: user.phone },
                    {
                      label: "Ville",
                      value: user.address?.city || "Non renseignée",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className={styles.infoRow}>
                      <span className={styles.infoLabel}>{label}</span>
                      <span className={styles.infoValue}>{value}</span>
                    </div>
                  ))}
                  <div className="mt-3">
                    <button type="button" className="btn btn-outline-dark btn-sm" disabled>
                      <i className="bi bi-pencil me-1" aria-hidden="true"></i>
                      Modifier mes informations
                    </button>
                  </div>
                </div>

                {/* Quick stats réelles liées au compte connecté */}
                <div className="row g-3 mb-4">
                  {[
                    {
                      icon: "bi bi-bag-check",
                      value: orderStats?.totalOrders ?? 0,
                      label: "Commandes",
                      color: "var(--mf-orange)",
                    },
                    {
                      icon: "bi bi-heart",
                      value: favoriteCount,
                      label: "Favoris",
                      color: "var(--mf-green)",
                    },
                    {
                      icon: "bi bi-cash-stack",
                      value: formatPrice(
                        orderStats?.totalSpent ?? 0,
                        "GNF",
                      ),
                      label: "Total dépensé",
                      color: "var(--mf-blue)",
                    },
                  ].map(({ icon, value, label, color }) => (
                    <div key={label} className="col-sm-4">
                      <div className="bg-white rounded-3 shadow-sm p-3 text-center">
                        <i className={`${icon} fs-2 mb-2`} style={{ color }} aria-hidden="true"></i>
                        <div className="fw-bold fs-5">{value}</div>
                        <div className="text-secondary small">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notification settings */}
                <div className={styles.infoCard}>
                  <h2 className={styles.infoCardTitle}>Notifications</h2>
                  {NOTIF_SETTINGS.map(({ label, desc }) => (
                    <div key={label} className={styles.notifRow}>
                      <div>
                        <p className={styles.notifLabel}>{label}</p>
                        <p className={styles.notifDesc}>{desc}</p>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id={`notif-${label}`}
                          defaultChecked
                          style={{ width: "2.5rem", height: "1.25rem", cursor: "pointer" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security – reflète les indicateurs réels du compte */}
                <div className={styles.securityCard}>
                  <h2 className={styles.securityCardTitle}>
                    <i className="bi bi-shield-lock me-2" aria-hidden="true"></i>
                    Sécurité du compte
                  </h2>
                  {[
                    {
                      icon: "bi bi-check-circle-fill text-success",
                      label: "Mot de passe",
                      desc: "Votre compte est protégé par un mot de passe.",
                    },
                    {
                      icon: user.isPhoneVerified
                        ? "bi bi-phone text-success"
                        : "bi bi-phone text-light",
                      label: "Numéro de téléphone",
                      desc: user.isPhoneVerified
                        ? "Associé et vérifié."
                        : "Associé, vérification en attente.",
                    },
                    {
                      icon: user.isEmailVerified
                        ? "bi bi-envelope text-success"
                        : "bi bi-envelope text-light",
                      label: "Adresse e-mail",
                      desc: user.isEmailVerified
                        ? "Confirmée et active."
                        : "Renseignée, confirmation en attente.",
                    },
                  ].map(({ icon, label, desc }) => (
                    <div key={label} className={styles.securityItem}>
                      <i className={icon} aria-hidden="true"></i>
                      <div>
                        <p className={styles.securityItemLabel}>{label}</p>
                        <p className={styles.securityItemDesc}>{desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3">
                    <button type="button" className="btn btn-outline-light btn-sm" disabled>
                      <i className="bi bi-key me-1" aria-hidden="true"></i>
                      Changer le mot de passe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Visiteur non connecté : formulaire connexion / inscription */
            <div className="row justify-content-center">
              <div className="col-lg-7">
                <div className="text-center mb-4">
                  <span className={catalogStyles.eyebrow}>Connexion / Inscription</span>
                  <h2 className="h4 fw-bold mb-0">Accéder à votre compte</h2>
                </div>
                <AuthTabs />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
