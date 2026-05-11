import type { Metadata } from "next";
import Link from "next/link";
import AccordionFaq from "@/components/common/AccordionFaq";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import { siteConfig } from "@/config/site";
import styles from "@/styles/aide.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Centre d'aide",
  description:
    "Centre d'aide Marché Fooly : réponses aux questions sur les achats, commandes, vendeurs, livraison, paiement, compte client et support à Sangarédi.",
};

const CATEGORIES = [
  {
    icon: "bi bi-bag-check",
    title: "Acheter un produit",
    text: "Trouver un article, comparer les offres et passer commande.",
    linkLabel: "Voir la boutique",
    href: "/boutique",
  },
  {
    icon: "bi bi-truck",
    title: "Suivre une commande",
    text: "Vérifier le statut, les produits et les informations de réception.",
    linkLabel: "Mes commandes",
    href: "/commandes",
  },
  {
    icon: "bi bi-shop",
    title: "Devenir vendeur",
    text: "Ouvrir une boutique, présenter vos produits et toucher plus de clients.",
    linkLabel: "Créer ma boutique",
    href: "/devenir-vendeur",
  },
  {
    icon: "bi bi-headset",
    title: "Contacter FOOLY",
    text: "Obtenir une aide personnalisée pour votre demande.",
    linkLabel: "Nous écrire",
    href: "/contact",
  },
];

const BUY_STEPS = [
  {
    n: "1",
    title: "Recherchez votre produit",
    text: "Utilisez la barre de recherche ou parcourez les catégories.",
  },
  {
    n: "2",
    title: "Consultez la fiche produit",
    text: "Vérifiez le prix, le vendeur, la disponibilité et les détails.",
  },
  {
    n: "3",
    title: "Ajoutez au panier",
    text: "Validez les quantités et passez à la finalisation de commande.",
  },
];

const SELL_STEPS = [
  {
    n: "1",
    title: "Créez votre boutique",
    text: "Présentez votre activité, votre localisation et vos produits.",
  },
  {
    n: "2",
    title: "Publiez vos articles",
    text: "Ajoutez les prix, descriptions, catégories et informations utiles.",
  },
  {
    n: "3",
    title: "Recevez des commandes",
    text: "Gagnez en visibilité auprès des clients locaux de Sangarédi.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Comment rechercher un produit sur Marché Fooly ?",
    answer:
      "Utilisez la barre de recherche en haut du site ou cliquez sur une catégorie. Vous pouvez ensuite filtrer les résultats par catégorie, prix, disponibilité ou vendeur local.",
  },
  {
    question: "Comment suivre ma commande ?",
    answer:
      "Allez dans la page Mes commandes. Vous y trouverez le statut de chaque commande, les produits achetés, le vendeur concerné et les étapes de traitement.",
  },
  {
    question: "Comment contacter un vendeur ?",
    answer:
      "Depuis une fiche produit ou une commande, utilisez les boutons de contact disponibles pour demander plus d'informations ou organiser la réception.",
  },
  {
    question: "Comment devenir vendeur ?",
    answer:
      "Cliquez sur Devenir vendeur, remplissez vos informations de boutique, votre catégorie principale, votre localisation et le nombre de produits que vous souhaitez proposer.",
  },
  {
    question: "Quels produits peut-on vendre sur Marché Fooly ?",
    answer:
      "Les vendeurs peuvent proposer des produits locaux, téléphones, accessoires, vêtements, électroménagers, maison, cuisine, alimentation, meubles, bijoux et autres articles adaptés au commerce local.",
  },
  {
    question: "Comment modifier mon panier ?",
    answer:
      "Depuis la page Panier, vous pouvez modifier les quantités, retirer un article ou continuer vos achats avant de passer à la caisse.",
  },
];

const POPULAR_LINKS = [
  { label: "Où est ma commande ?", href: "/commandes" },
  { label: "Comment modifier mon panier ?", href: "/panier" },
  { label: "Comment ouvrir une boutique ?", href: "/devenir-vendeur" },
  { label: "Comment joindre le support ?", href: "/contact" },
];

const QUICK_ACCESS = [
  { icon: "bi bi-bag", title: "Boutique", text: "Parcourir tous les produits disponibles.", href: "/boutique" },
  { icon: "bi bi-grid", title: "Catégories", text: "Trouver un produit par rayon.", href: "/categories" },
  { icon: "bi bi-person", title: "Mon compte", text: "Gérer vos informations et achats.", href: "/mon-compte" },
  { icon: "bi bi-heart", title: "Favoris", text: "Retrouver vos produits sauvegardés.", href: "/favoris" },
];

export default function AidePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.helpHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>Accueil</Link>
              </li>
              <li className={`breadcrumb-item active ${styles.breadcrumbCurrent}`} aria-current="page">
                Aide
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-question-circle" aria-hidden="true"></i>
                Centre d&apos;aide Marché Fooly
              </span>
              <h1 className={`${styles.helpTitle} mb-4`}>Comment pouvons-nous vous aider ?</h1>
              <p className="fs-5 text-secondary mb-0">
                Trouvez des réponses rapides sur les achats, les commandes, les vendeurs,
                le compte client, la livraison locale et le fonctionnement de Marché Fooly.
              </p>
            </div>

            <div className="col-lg-5">
              <div className={styles.searchCard}>
                <h2 className="h4 fw-bold mb-3">Rechercher une réponse</h2>
                <form action="/aide" method="get" className="d-flex flex-column flex-sm-row gap-2">
                  <input
                    className={styles.searchInput}
                    type="search"
                    name="q"
                    placeholder="Ex : livraison, vendeur, commande…"
                    aria-label="Rechercher dans l'aide"
                  />
                  <button className="btn btn-warning fw-bold px-4" type="submit">
                    Rechercher
                  </button>
                </form>
                <div className="d-flex flex-wrap gap-2 mt-4">
                  <Link href="#faq" className={styles.helpTag}>Commandes</Link>
                  <Link href="#guides" className={styles.helpTag}>Acheter</Link>
                  <Link href="#vendeurs" className={styles.helpTag}>Vendre</Link>
                  <Link href="/contact" className={styles.helpTag}>Support</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────── */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className={catalogStyles.eyebrow}>Assistance rapide</span>
            <h2 className={catalogStyles.sectionTitle}>Choisissez votre besoin</h2>
            <p className={catalogStyles.sectionDescription}>
              Accédez directement aux informations qui correspondent à votre situation.
            </p>
          </div>

          <div className="row g-4">
            {CATEGORIES.map(({ icon, title, text, linkLabel, href }) => (
              <div key={title} className="col-md-6 col-lg-3">
                <Link href={href} className={styles.categoryCard}>
                  <div className={styles.categoryIcon}>
                    <i className={icon} aria-hidden="true"></i>
                  </div>
                  <h3 className="h5 fw-bold">{title}</h3>
                  <p className="text-secondary mb-3">{text}</p>
                  <span className={styles.categoryArrow}>
                    {linkLabel} <i className="bi bi-arrow-right" aria-hidden="true"></i>
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guides ────────────────────────────────────────────────── */}
      <section id="guides" className={styles.guidesSection}>
        <div className="container">
          <div className="text-center mb-5">
            <span className={catalogStyles.eyebrow}>Guides pratiques</span>
            <h2 className={catalogStyles.sectionTitle}>Bien utiliser Marché Fooly</h2>
          </div>

          <div className="row g-4">
            {/* Buy guide */}
            <div className="col-lg-6">
              <div className={styles.guideCard}>
                <div className={styles.guideIcon}>
                  <i className="bi bi-bag-check" aria-hidden="true"></i>
                </div>
                <h3 className="h4 fw-bold mb-3">Acheter sur Marché Fooly</h3>
                {BUY_STEPS.map(({ n, title, text }) => (
                  <div key={n} className={styles.guideStep}>
                    <div className={styles.stepNumber}>{n}</div>
                    <div>
                      <strong>{title}</strong>
                      <p className="text-secondary mb-0">{text}</p>
                    </div>
                  </div>
                ))}
                <Link href="/boutique" className="btn btn-warning fw-bold mt-4">
                  Commencer mes achats
                </Link>
              </div>
            </div>

            {/* Sell guide */}
            <div id="vendeurs" className="col-lg-6">
              <div className={styles.guideCard}>
                <div className={styles.guideIcon}>
                  <i className="bi bi-shop" aria-hidden="true"></i>
                </div>
                <h3 className="h4 fw-bold mb-3">Vendre sur Marché Fooly</h3>
                {SELL_STEPS.map(({ n, title, text }) => (
                  <div key={n} className={styles.guideStep}>
                    <div className={styles.stepNumber}>{n}</div>
                    <div>
                      <strong>{title}</strong>
                      <p className="text-secondary mb-0">{text}</p>
                    </div>
                  </div>
                ))}
                <Link href="/devenir-vendeur" className="btn btn-warning fw-bold mt-4">
                  Devenir vendeur
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ + Sidebar ─────────────────────────────────────────── */}
      <section id="faq" className="py-5">
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* FAQ */}
            <div className="col-lg-8">
              <div className={styles.faqPanel}>
                <span className={catalogStyles.eyebrow}>FAQ</span>
                <h2 className={catalogStyles.sectionTitle}>Questions fréquentes</h2>
                <AccordionFaq items={FAQ_ITEMS} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className={styles.quickCard}>
                <div className={styles.quickIcon}>
                  <i className="bi bi-lightning-charge" aria-hidden="true"></i>
                </div>
                <h2 className="h4 fw-bold mb-3">Questions populaires</h2>
                {POPULAR_LINKS.map(({ label, href }) => (
                  <Link key={label} href={href} className={styles.popularQuestion}>
                    <span>{label}</span>
                    <i className="bi bi-arrow-right" aria-hidden="true"></i>
                  </Link>
                ))}
              </div>

              <div className={`${styles.contactHelpCard} mt-4`}>
                <span className="badge bg-warning text-dark rounded-pill mb-3">
                  Support direct
                </span>
                <h2 className="h4 fw-bold mb-3">Besoin d&apos;une aide personnalisée ?</h2>
                <p style={{ color: "rgba(255,255,255,0.6)" }}>
                  Contactez l&apos;équipe Marché Fooly pour une question sur un produit, une commande ou une boutique vendeur.
                </p>
                <div className="d-grid gap-2">
                  <Link href="/contact" className="btn btn-light fw-bold">
                    Contacter FOOLY
                  </Link>
                  <a href={siteConfig.whatsappHref} className="btn btn-outline-light fw-bold">
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick access ──────────────────────────────────────────── */}
      <section className={styles.quickAccessSection}>
        <div className="container">
          <div className="text-center mb-5">
            <span className={catalogStyles.eyebrow}>Liens utiles</span>
            <h2 className={catalogStyles.sectionTitle}>Accès rapide</h2>
          </div>

          <div className="row g-4">
            {QUICK_ACCESS.map(({ icon, title, text, href }) => (
              <div key={title} className="col-md-6 col-lg-3">
                <Link href={href} className={styles.quickAccessCard}>
                  <div className={styles.quickAccessIcon}>
                    <i className={icon} aria-hidden="true"></i>
                  </div>
                  <h3 className="h5 fw-bold">{title}</h3>
                  <p className="text-secondary mb-0">{text}</p>
                </Link>
              </div>
            ))}
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
