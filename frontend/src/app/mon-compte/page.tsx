import type { Metadata } from "next";
import Link from "next/link";
import AuthTabs from "@/components/account/AuthTabs";
import AccountSidebar from "@/components/account/AccountSidebar";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { orders } from "@/data/orders";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/account.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Mon compte",
  description:
    "Gérez votre profil, consultez vos commandes et personnalisez vos préférences sur Marché Fooly.",
};

const NOTIF_SETTINGS = [
  { label: "Nouvelles commandes", desc: "Recevez une alerte à chaque commande passée." },
  { label: "Promotions locales", desc: "Offres exclusives des vendeurs de Sangarédi." },
  { label: "Mises à jour de livraison", desc: "Notifications dès que votre colis évolue." },
];

const SECURITY_ITEMS = [
  {
    icon: "bi bi-check-circle-fill text-success",
    label: "Mot de passe",
    desc: "Dernière modification il y a 30 jours.",
  },
  {
    icon: "bi bi-phone text-success",
    label: "Numéro de téléphone",
    desc: "Associé et vérifié.",
  },
  {
    icon: "bi bi-envelope text-success",
    label: "Adresse e-mail",
    desc: "Confirmée et active.",
  },
];

export default function MonComptePage() {
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

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
              <h1 className={`${styles.accountTitle} mb-3`}>Mon compte</h1>
              <p className="fs-5 mb-0" style={{ color: "rgba(255,255,255,0.75)" }}>
                Gérez votre profil, suivez vos commandes et personnalisez votre expérience Marché Fooly.
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
          <div className="row g-4 align-items-start">
            {/* Left column – sidebar */}
            <div className="col-lg-3">
              <AccountSidebar />
            </div>

            {/* Right column – panels */}
            <div className="col-lg-9">
              {/* Auth section – visitors see login/register */}
              <div className="mb-4">
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3">
                  <div>
                    <span className={catalogStyles.eyebrow}>Connexion / Inscription</span>
                    <h2 className="h4 fw-bold mb-0">Accéder à votre compte</h2>
                  </div>
                </div>
                <AuthTabs />
              </div>

              {/* Profile info */}
              <div className={styles.infoCard}>
                <h2 className={styles.infoCardTitle}>Informations personnelles</h2>
                {[
                  { label: "Prénom", value: "Mamadou" },
                  { label: "Nom", value: "Diallo" },
                  { label: "E-mail", value: "mamadou@exemple.com" },
                  { label: "Téléphone", value: "+224 620 000 000" },
                  { label: "Ville", value: "Sangarédi, Guinée" },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.infoRow}>
                    <span className={styles.infoLabel}>{label}</span>
                    <span className={styles.infoValue}>{value}</span>
                  </div>
                ))}
                <div className="mt-3">
                  <button type="button" className="btn btn-outline-dark btn-sm">
                    <i className="bi bi-pencil me-1" aria-hidden="true"></i>
                    Modifier mes informations
                  </button>
                </div>
              </div>

              {/* Quick stats */}
              <div className="row g-3 mb-4">
                {[
                  { icon: "bi bi-bag-check", value: orders.length, label: "Commandes", color: "var(--mf-orange)" },
                  { icon: "bi bi-heart", value: 6, label: "Favoris", color: "var(--mf-green)" },
                  { icon: "bi bi-cash-stack", value: formatPrice(totalSpent, "GNF"), label: "Total dépensé", color: "var(--mf-blue)" },
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

              {/* Security */}
              <div className={styles.securityCard}>
                <h2 className={styles.securityCardTitle}>
                  <i className="bi bi-shield-lock me-2" aria-hidden="true"></i>
                  Sécurité du compte
                </h2>
                {SECURITY_ITEMS.map(({ icon, label, desc }) => (
                  <div key={label} className={styles.securityItem}>
                    <i className={icon} aria-hidden="true"></i>
                    <div>
                      <p className={styles.securityItemLabel}>{label}</p>
                      <p className={styles.securityItemDesc}>{desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-3">
                  <button type="button" className="btn btn-outline-light btn-sm">
                    <i className="bi bi-key me-1" aria-hidden="true"></i>
                    Changer le mot de passe
                  </button>
                </div>
              </div>
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
