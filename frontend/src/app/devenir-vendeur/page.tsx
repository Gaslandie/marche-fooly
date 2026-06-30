import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SellerForm from "@/components/seller/SellerForm";
import AccordionFaq from "@/components/common/AccordionFaq";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { getCurrentUser } from "@/lib/auth";
import { hasBackOfficeAccess } from "@/lib/admin";
import { getMySellerProfile } from "@/lib/seller";
import { getSellerCta, hasSellerProfileStatus } from "@/lib/sellerCta";
import styles from "@/styles/seller.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Devenir vendeur",
  description:
    "Créez votre boutique sur Marché Fooly et commencez à vendre vos produits en ligne à Sangarédi. Marketplace locale pour commerçants et vendeurs indépendants.",
};

export const dynamic = "force-dynamic";

const BENEFITS = [
  {
    icon: "bi bi-geo-alt",
    title: "Clients locaux",
    text: "Touchez directement les acheteurs de Sangarédi et des zones voisines.",
  },
  {
    icon: "bi bi-phone",
    title: "Simple à utiliser",
    text: "Une expérience claire, mobile first, adaptée aux commerçants locaux.",
  },
  {
    icon: "bi bi-megaphone",
    title: "Plus de visibilité",
    text: "Vos produits sont présentés dans une marketplace moderne et crédible.",
  },
  {
    icon: "bi bi-graph-up-arrow",
    title: "Croissance business",
    text: "Développez vos ventes avec une présence digitale professionnelle.",
  },
];

const HOW_STEPS = [
  {
    n: "1",
    title: "Connectez-vous et remplissez le formulaire",
    text: "Votre demande est rattachée à votre compte Marché Fooly.",
  },
  {
    n: "2",
    title: "Ajoutez vos produits",
    text: "Présentez vos articles avec prix, descriptions, catégories et photos.",
  },
  {
    n: "3",
    title: "Recevez des commandes",
    text: "Les clients découvrent vos produits et vous contactent ou commandent en ligne.",
  },
];

const PROOF_STATS = [
  { value: "Local", label: "Sangarédi" },
  { value: "Compte", label: "Rattaché" },
  { value: "Validation", label: "Back office" },
  { value: "Suivi", label: "Espace vendeur" },
];

const FAQ_ITEMS = [
  {
    question: "Est-ce que la création de boutique est déjà fonctionnelle ?",
    answer:
      "Oui. Connectez-vous, soumettez votre demande via ce formulaire et l'équipe FOOLY validera votre boutique depuis le back office.",
  },
  {
    question: "Quels vendeurs peuvent rejoindre Marché Fooly ?",
    answer:
      "Commerçants locaux, vendeurs indépendants, boutiques physiques, particuliers et petites entreprises de Sangarédi ou des villes voisines.",
  },
  {
    question: "Comment les clients vont-ils commander ?",
    answer:
      "Marché Fooly propose un parcours complet : boutique, détail produit, panier et checkout. Les commandes sont transmises au vendeur pour traitement et livraison.",
  },
  {
    question: "Est-ce qu'il y aura un paiement en ligne ?",
    answer:
      "Marché Fooly propose le paiement à la livraison et le retrait en boutique. Le paiement en ligne peut être proposé selon les options disponibles.",
  },
];

export default async function DevenirVendeurPage() {
  const [user, sellerProfile] = await Promise.all([
    getCurrentUser(),
    getMySellerProfile(),
  ]);
  const isBackOfficeUser = user ? hasBackOfficeAccess(user.role) : false;
  const sellerStatus = isBackOfficeUser ? null : sellerProfile?.status ?? null;
  const sellerCta = getSellerCta(sellerStatus, {
    defaultLabel: "Créer ma boutique",
  });
  const hasSellerStatus = hasSellerProfileStatus(sellerStatus);
  const sellerStatusColor =
    sellerStatus === "approved"
      ? "var(--mf-green)"
      : sellerStatus === "pending"
        ? "var(--mf-orange)"
        : "#dc3545";

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.sellerHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>Accueil</Link>
              </li>
              <li className={`breadcrumb-item active ${styles.breadcrumbCurrent}`} aria-current="page">
                {isBackOfficeUser
                  ? "Compte vendeur séparé"
                  : hasSellerStatus
                    ? "Statut vendeur"
                    : "Devenir vendeur"}
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-shop-window" aria-hidden="true"></i>
                Espace vendeurs Marché Fooly
              </span>
              <h1 className={`${styles.sellerTitle} mb-4`}>
                {isBackOfficeUser
                  ? "Utilisez un compte vendeur séparé"
                  : hasSellerStatus
                  ? "Suivez votre activité vendeur avec FOOLY"
                  : "Vendez en ligne facilement avec FOOLY"}
              </h1>
              <p className="fs-5 text-secondary mb-4">
                {isBackOfficeUser
                  ? "Les comptes owner, admin et staff sont réservés au back office. Pour vendre sur Marché Fooly, créez un compte vendeur séparé avec d'autres informations."
                  : hasSellerStatus
                  ? "Votre compte possède déjà une boutique ou une demande vendeur. Consultez votre espace pour suivre son statut."
                  : "Créez votre boutique gratuitement et commencez à vendre partout à Sangarédi. Marché Fooly aide les commerçants locaux à gagner en visibilité et à recevoir plus de commandes."}
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link
                  href={isBackOfficeUser ? "/admin" : hasSellerStatus ? sellerCta.href : "#formulaire-vendeur"}
                  className="btn btn-warning fw-bold"
                >
                  {isBackOfficeUser
                    ? "Retour au back office"
                    : hasSellerStatus
                      ? sellerCta.label
                      : "Créer ma boutique"}{" "}
                  <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
                </Link>
                <Link href="/boutique" className="btn btn-outline-dark fw-bold">
                  Voir la marketplace
                </Link>
              </div>
            </div>

            {/* Visual with image + dashboard overlay */}
            <div className="col-lg-6">
              <div className={styles.sellerVisual}>
                <Image
                  src="/images/banners/seller-hero.jpg"
                  alt="Vendeur local utilisant Marché Fooly pour vendre ses produits à Sangarédi"
                  width={600}
                  height={220}
                  className={styles.sellerHeroImage}
                  priority
                />

                <div className={styles.dashboardCard}>
                  <div className={styles.dashTop}>
                    <div className="d-flex align-items-center gap-3">
                      <div className={styles.dashAvatar}>
                        <i className="bi bi-shop" aria-hidden="true"></i>
                      </div>
                      <div>
                        <strong className="d-block">Demande vendeur</strong>
                        <span className="text-secondary small">Validation par l&apos;équipe FOOLY</span>
                      </div>
                    </div>
                    <span className="badge rounded-pill bg-warning text-dark">Suivi</span>
                  </div>

                  <div className={styles.miniProductRow}>
                    <div className={styles.miniProductIcon}>
                      <i className="bi bi-person-check" aria-hidden="true"></i>
                    </div>
                    <div className="flex-grow-1">
                      <strong className="d-block">Compte vendeur identifié</strong>
                      <span className="text-secondary small">Chaque boutique est rattachée à un utilisateur connecté.</span>
                    </div>
                  </div>
                  <div className={styles.miniProductRow}>
                    <div className={styles.miniProductIcon}>
                      <i className="bi bi-shield-check" aria-hidden="true"></i>
                    </div>
                    <div className="flex-grow-1">
                      <strong className="d-block">Validation admin</strong>
                      <span className="text-secondary small">L&apos;équipe FOOLY approuve la boutique avant publication.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────── */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className={catalogStyles.eyebrow}>Avantages vendeurs</span>
            <h2 className={catalogStyles.sectionTitle}>Pourquoi vendre sur Marché Fooly ?</h2>
            <p className={catalogStyles.sectionDescription}>
              Une marketplace locale pensée pour simplifier la vente en ligne et inspirer confiance aux acheteurs.
            </p>
          </div>

          <div className="row g-4">
            {BENEFITS.map(({ icon, title, text }) => (
              <div key={title} className="col-md-6 col-lg-3">
                <div className={styles.benefitCard}>
                  <div className={styles.benefitIcon}>
                    <i className={icon} aria-hidden="true"></i>
                  </div>
                  <h3 className="h5 fw-bold">{title}</h3>
                  <p className="text-secondary mb-0">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className={styles.stepsSection}>
        <div className="container">
          <div className="text-center mb-5">
            <span className={catalogStyles.eyebrow}>Méthode simple</span>
            <h2 className={catalogStyles.sectionTitle}>Comment ça marche ?</h2>
            <p className={catalogStyles.sectionDescription}>
              Trois étapes pour passer d&apos;une boutique physique à une vitrine digitale locale.
            </p>
          </div>

          <div className="row g-4">
            {HOW_STEPS.map(({ n, title, text }) => (
              <div key={n} className="col-md-4">
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>{n}</div>
                  <h3 className="h5 fw-bold">{title}</h3>
                  <p className="text-secondary mb-0">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof section ─────────────────────────────────────────── */}
      <section className="py-5">
        <div className="container">
          <div className={styles.proofSection}>
            <div className="row align-items-center g-4">
              <div className="col-lg-6">
                <span className="badge bg-warning text-dark rounded-pill mb-3">Objectif local</span>
                <h2 className="display-6 fw-bold mb-3">
                  FOOLY peut devenir le Jumia local de Sangarédi
                </h2>
                <p style={{ color: "rgba(255,255,255,0.55)" }} className="mb-0">
                  L&apos;idée est simple : regrouper les vendeurs locaux dans une plateforme moderne,
                  rassurante et facile à utiliser pour les acheteurs.
                </p>
              </div>
              <div className="col-lg-6">
                <div className="row g-3">
                  {PROOF_STATS.map(({ value, label }) => (
                    <div key={label} className="col-6">
                      <div className={styles.proofItem}>
                        <span className={styles.proofValue}>{value}</span>
                        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem" }}>{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seller form ───────────────────────────────────────────── */}
      <section className="py-5">
        <div className="container">
          <div className="row g-5 align-items-start">
            <div className="col-lg-5">
              <span className={catalogStyles.eyebrow}>Demande vendeur</span>
              <h2 className={catalogStyles.sectionTitle}>
                {isBackOfficeUser
                  ? "Compte vendeur séparé requis"
                  : hasSellerStatus
                    ? "Votre statut vendeur FOOLY"
                    : "Créer votre boutique FOOLY"}
              </h2>
              <p className={catalogStyles.sectionDescription}>
                {isBackOfficeUser
                  ? "Votre compte back-office ne peut pas porter une boutique vendeur. Créez un autre compte pour déposer une demande vendeur."
                  : hasSellerStatus
                  ? "Votre compte possède déjà un statut vendeur. Vous pouvez suivre votre demande ou accéder à votre espace vendeur."
                  : user
                  ? "Remplissez ce formulaire pour créer votre boutique sur Marché Fooly. Votre demande sera traitée par l'équipe FOOLY."
                  : "Connectez-vous ou créez un compte avant d'envoyer votre demande vendeur. Cela permet de rattacher la boutique au bon propriétaire."}
              </p>

              <div className={styles.helpCard}>
                <h3 className="h5 fw-bold">Besoin d&apos;aide ?</h3>
                <p className="text-secondary">
                  Contactez l&apos;équipe Marché Fooly pour vous accompagner dans la mise en ligne de vos produits.
                </p>
                <Link href="/contact" className="btn btn-outline-dark">
                  <i className="bi bi-headset me-1" aria-hidden="true"></i>
                  Contacter FOOLY
                </Link>
              </div>
            </div>

            <div className="col-lg-7">
              {isBackOfficeUser ? (
                <div
                  id="formulaire-vendeur"
                  className={styles.formCard}
                  style={{ textAlign: "center", padding: "3rem" }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--mf-dark)",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 1.25rem",
                      fontSize: "2rem",
                      color: "#ffffff",
                    }}
                  >
                    <i className="bi bi-shield-lock" aria-hidden="true"></i>
                  </div>
                  <h3 className="h4 fw-bold mb-2">Utilisez un compte vendeur séparé</h3>
                  <p className="text-secondary mb-4">
                    Ce compte sert au back office. Pour ouvrir une boutique, créez un
                    compte vendeur séparé avec un autre email et un autre téléphone.
                  </p>
                  <Link href="/admin" className="btn btn-warning fw-bold">
                    Retour au back office
                  </Link>
                </div>
              ) : sellerProfile ? (
                <div
                  id="formulaire-vendeur"
                  className={styles.formCard}
                  style={{ textAlign: "center", padding: "3rem" }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: sellerStatusColor,
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 1.25rem",
                      fontSize: "2rem",
                      color: "#ffffff",
                    }}
                  >
                    <i className={sellerCta.icon} aria-hidden="true"></i>
                  </div>
                  <h3 className="h4 fw-bold mb-2">{sellerCta.label}</h3>
                  <p className="text-secondary mb-4">
                    La boutique <strong>{sellerProfile.storeName}</strong> est déjà
                    enregistrée sur votre compte. Consultez votre espace vendeur pour
                    suivre son statut.
                  </p>
                  <Link href={sellerCta.href} className="btn btn-warning fw-bold">
                    {sellerCta.label}
                  </Link>
                </div>
              ) : user ? (
                <SellerForm />
              ) : (
                <div
                  id="formulaire-vendeur"
                  className={styles.formCard}
                  style={{ textAlign: "center", padding: "3rem" }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--mf-orange)",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 1.25rem",
                      fontSize: "2rem",
                      color: "#ffffff",
                    }}
                  >
                    <i className="bi bi-person-lock" aria-hidden="true"></i>
                  </div>
                  <h3 className="h4 fw-bold mb-2">Connexion requise</h3>
                  <p className="text-secondary mb-4">
                    Créez un compte ou connectez-vous pour envoyer une demande vendeur.
                    Après connexion, vous reviendrez sur cette page pour finaliser la boutique.
                  </p>
                  <Link
                    href="/mon-compte?retour=/devenir-vendeur"
                    className="btn btn-warning fw-bold"
                  >
                    <i className="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>
                    Se connecter / créer un compte
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Seller FAQ ────────────────────────────────────────────── */}
      <section className={styles.faqSection}>
        <div className="container">
          <div className="text-center mb-5">
            <span className={catalogStyles.eyebrow}>Questions fréquentes</span>
            <h2 className={catalogStyles.sectionTitle}>FAQ vendeurs</h2>
          </div>
          <div className={styles.faqCard}>
            <AccordionFaq items={FAQ_ITEMS} />
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
