import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/contact/ContactForm";
import AccordionFaq from "@/components/common/AccordionFaq";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import styles from "@/styles/contact.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Marché Fooly à Sangarédi, Guinée. Assistance clients, vendeurs, commandes, partenariats et informations sur la marketplace locale.",
};

const HERO_CARDS = [
  { icon: "bi bi-clock", title: "Réponse rapide", text: "Support client et vendeur prévu pour accompagner les utilisateurs." },
  { icon: "bi bi-geo-alt", title: "Basé localement", text: "Marketplace pensée pour Sangarédi et ses environs." },
  { icon: "bi bi-shop", title: "Aide vendeurs", text: "Accompagnement pour rejoindre la marketplace." },
  { icon: "bi bi-bag-check", title: "Aide achats", text: "Informations produits, panier et suivi de commandes." },
];

const SUPPORT_CARDS = [
  {
    icon: "bi bi-bag-check",
    title: "Acheteurs",
    text: "Questions sur les produits, prix, disponibilité, panier et achat.",
    linkLabel: "Voir la boutique",
    href: "/boutique",
  },
  {
    icon: "bi bi-shop",
    title: "Vendeurs",
    text: "Création de boutique, ajout de produits et visibilité locale.",
    linkLabel: "Devenir vendeur",
    href: "/devenir-vendeur",
  },
  {
    icon: "bi bi-truck",
    title: "Commandes",
    text: "Aide pour panier, checkout, suivi et livraison.",
    linkLabel: "Mes commandes",
    href: "/commandes",
  },
  {
    icon: "bi bi-briefcase",
    title: "Partenariat",
    text: "Collaboration, communication, business local et opportunités.",
    linkLabel: "Nous écrire",
    href: "/contact",
  },
];

const FAQ_ITEMS = [
  {
    question: "Est-ce que Marché Fooly vend directement les produits ?",
    answer:
      "Marché Fooly est pensé comme une marketplace locale : plusieurs vendeurs peuvent proposer leurs produits sur la plateforme.",
  },
  {
    question: "Le paiement en ligne est-il déjà actif ?",
    answer:
      "Marché Fooly propose le paiement à la livraison et le retrait en boutique.",
  },
  {
    question: "Comment devenir vendeur ?",
    answer:
      "Allez sur la page Devenir vendeur et remplissez le formulaire de demande avec les informations de votre boutique.",
  },
  {
    question: "Marché Fooly est-il uniquement pour Sangarédi ?",
    answer:
      "La marketplace est d'abord positionnée sur Sangarédi, avec une ouverture possible vers les villes voisines.",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.contactHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>Accueil</Link>
              </li>
              <li className={`breadcrumb-item active ${styles.breadcrumbCurrent}`} aria-current="page">
                Contact
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-headset" aria-hidden="true"></i>
                Assistance Marché Fooly
              </span>
              <h1 className={`${styles.contactTitle} mb-4`}>Contactez l&apos;équipe FOOLY</h1>
              <p className="fs-5 text-secondary mb-4">
                Une question sur un produit, une commande, une boutique vendeur ou un partenariat ?
                Marché Fooly vous accompagne pour acheter et vendre plus facilement à Sangarédi.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <a className="btn btn-warning fw-bold" href="tel:+224624273805">
                  <i className="bi bi-telephone me-1" aria-hidden="true"></i>
                  Appeler maintenant
                </a>
                <a className="btn btn-outline-dark fw-bold" href="https://wa.me/224624273805">
                  <i className="bi bi-whatsapp me-1" aria-hidden="true"></i>
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="row g-3">
                {HERO_CARDS.map(({ icon, title, text }) => (
                  <div key={title} className="col-6">
                    <div className={styles.contactCard}>
                      <div className={styles.contactIcon}>
                        <i className={icon} aria-hidden="true"></i>
                      </div>
                      <h2 className="h6 fw-bold">{title}</h2>
                      <p className="text-secondary small mb-0">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Form + Side panel ─────────────────────────────────────── */}
      <section className="py-5" style={{ background: "#f8f9fa" }}>
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* Side panel */}
            <div className="col-lg-4 order-lg-1">
              <aside className={styles.sidepanel}>
                <div className="position-relative">
                  <span className="badge bg-warning text-dark rounded-pill mb-3">Coordonnées</span>
                  <h2 className="h3 fw-bold mb-3 text-white">Marché Fooly</h2>
                  <p style={{ color: "rgba(255,255,255,0.55)" }} className="mb-4">
                    Marketplace locale basée à Sangarédi, Guinée.
                  </p>

                  {[
                    {
                      icon: "bi bi-geo-alt",
                      label: "Adresse",
                      value: "Sangarédi, Guinée",
                      href: undefined,
                    },
                    {
                      icon: "bi bi-telephone",
                      label: "Téléphone",
                      value: "+224 624 27 38 05",
                      href: "tel:+224624273805",
                    },
                    {
                      icon: "bi bi-envelope",
                      label: "Email",
                      value: "contact@marchefooly.com",
                      href: "mailto:contact@marchefooly.com",
                    },
                    {
                      icon: "bi bi-clock",
                      label: "Horaires",
                      value: "Lun - Sam : 8h00 - 18h00",
                      href: undefined,
                    },
                  ].map(({ icon, label, value, href }) => (
                    <div key={label} className={styles.sideInfoItem}>
                      <i className={`${icon} ${styles.sideInfoIcon}`} aria-hidden="true"></i>
                      <div>
                        <strong className="d-block text-white">{label}</strong>
                        {href ? (
                          <a href={href} className={styles.sideInfoLink}>{value}</a>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem" }}>{value}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 d-flex flex-wrap gap-2">
                    <a className="btn btn-light fw-bold" href="https://wa.me/224624273805">
                      WhatsApp
                    </a>
                    <Link href="/devenir-vendeur" className="btn btn-outline-light fw-bold">
                      Devenir vendeur
                    </Link>
                  </div>
                </div>
              </aside>
            </div>

            {/* Contact form */}
            <div className="col-lg-8 order-lg-2">
              <ContactForm />

              {/* WhatsApp banner */}
              <div className={`${styles.whatsappBanner} mt-4`}>
                <div className="row align-items-center g-3">
                  <div className="col-lg-8">
                    <h3 className="h4 fw-bold mb-2">
                      <i className="bi bi-whatsapp text-success me-2" aria-hidden="true"></i>
                      Besoin d&apos;une réponse rapide ?
                    </h3>
                    <p className="text-secondary mb-0">
                      Contactez Marché Fooly directement sur WhatsApp pour les demandes urgentes.
                    </p>
                  </div>
                  <div className="col-lg-4 text-lg-end">
                    <a className="btn btn-success fw-bold" href="https://wa.me/224624273805">
                      Écrire sur WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Support services ──────────────────────────────────────── */}
      <section className={styles.supportSection}>
        <div className="container">
          <div className="text-center mb-5">
            <span className={catalogStyles.eyebrow}>Support</span>
            <h2 className={catalogStyles.sectionTitle}>Choisissez le bon service</h2>
            <p className={catalogStyles.sectionDescription}>
              Une organisation claire pour orienter les clients, vendeurs et partenaires.
            </p>
          </div>

          <div className="row g-4">
            {SUPPORT_CARDS.map(({ icon, title, text, linkLabel, href }) => (
              <div key={title} className="col-md-6 col-lg-3">
                <div className={styles.supportCard}>
                  <div className={styles.supportIcon}>
                    <i className={icon} aria-hidden="true"></i>
                  </div>
                  <h3 className="h5 fw-bold">{title}</h3>
                  <p className="text-secondary">{text}</p>
                  <Link href={href} className={styles.supportLink}>
                    {linkLabel} <i className="bi bi-arrow-right" aria-hidden="true"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Map + FAQ ─────────────────────────────────────────────── */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4 align-items-stretch">
            {/* Map placeholder */}
            <div className="col-lg-6">
              <div className={`${styles.mapCard} h-100`}>
                <div className={styles.mapPlaceholder}>
                  <div>
                    <div className={styles.mapMarker}>
                      <i className="bi bi-geo-alt-fill" aria-hidden="true"></i>
                    </div>
                    <h2 className="h3 fw-bold">Sangarédi, Guinée</h2>
                    <p className="text-secondary mb-0">
                      Localisation de la marketplace locale à Sangarédi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="col-lg-6">
              <div className={`${styles.faqCard} h-100`}>
                <span className={catalogStyles.eyebrow}>FAQ rapide</span>
                <h2 className="h3 fw-bold mb-4">Questions fréquentes</h2>
                <AccordionFaq items={FAQ_ITEMS} />
                <Link href="/aide" className="btn btn-warning fw-bold mt-4">
                  Voir le centre d&apos;aide
                </Link>
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
