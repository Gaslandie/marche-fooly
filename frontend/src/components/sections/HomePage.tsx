import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { siteConfig } from "@/config/site";
import { getSellerCta, hasSellerProfileStatus } from "@/lib/sellerCta";
import type { SellerCtaStatus } from "@/lib/sellerCta";
import type { CategoryItem, ProductItem } from "@/types/catalog";
import styles from "@/app/page.module.css";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
  action?: {
    href: string;
    label: string;
  };
};

type Feature = {
  icon: string;
  title: string;
  description: string;
};

type Step = {
  number: string;
  title: string;
  description: string;
};

type Reason = {
  icon: string;
  title: string;
  description: string;
  accentClass: string;
};

const sellerFeatures: Feature[] = [
  {
    icon: "bi bi-cash-coin",
    title: "Paiement simple",
    description: "Des ventes locales plus fluides avec un parcours clair.",
  },
  {
    icon: "bi bi-people",
    title: "Clients locaux",
    description: "Touchez rapidement les acheteurs proches de vous.",
  },
  {
    icon: "bi bi-phone",
    title: "Mobile first",
    description: "Une boutique facile à gérer depuis un téléphone.",
  },
  {
    icon: "bi bi-graph-up-arrow",
    title: "Croissance business",
    description: "Plus de visibilité pour générer plus de commandes.",
  },
];

const steps: Step[] = [
  {
    number: "1",
    title: "Créez un compte",
    description: "Inscrivez-vous rapidement pour acheter, vendre et suivre vos produits préférés.",
  },
  {
    number: "2",
    title: "Ajoutez vos produits",
    description: "Présentez vos articles avec prix, photos et description claire pour inspirer confiance.",
  },
  {
    number: "3",
    title: "Recevez des commandes",
    description: "Les acheteurs vous trouvent plus facilement et commandent depuis la marketplace.",
  },
];

const reasons: Reason[] = [
  {
    icon: "bi bi-geo-alt",
    title: "Marketplace locale",
    description: "Pensée pour Sangarédi et les besoins du quotidien.",
    accentClass: styles.orangeAccent,
  },
  {
    icon: "bi bi-shield-check",
    title: "Confiance",
    description: "Des vendeurs identifiés et une navigation rassurante.",
    accentClass: styles.greenAccent,
  },
  {
    icon: "bi bi-credit-card",
    title: "Paiement simple",
    description: "Un parcours adapté aux achats locaux et aux échanges directs.",
    accentClass: styles.blueAccent,
  },
  {
    icon: "bi bi-truck",
    title: "Livraison locale",
    description: "Retrait vendeur ou livraison de proximité selon le besoin.",
    accentClass: styles.orangeAccent,
  },
  {
    icon: "bi bi-headset",
    title: "Support vendeur",
    description: "Une solution pensée pour accompagner les commerçants locaux.",
    accentClass: styles.greenAccent,
  },
  {
    icon: "bi bi-box2-heart",
    title: "Produits proches",
    description: "Achetez localement sans perdre du temps à chercher partout.",
    accentClass: styles.blueAccent,
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  action,
}: SectionHeadingProps) {
  return (
    <div
      className={[
        styles.sectionHeader,
        centered ? styles.sectionHeaderCentered : "",
        action ? styles.sectionHeaderSplit : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionSubtitle}>{description}</p>
      </div>

      {action ? (
        <Link href={action.href} className="btn btn-outline-dark">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

type HomePageProps = {
  sellerStatus: SellerCtaStatus;
  showSellerEntry: boolean;
  categories: CategoryItem[];
  products: ProductItem[];
};

export default function HomePage({
  sellerStatus,
  showSellerEntry,
  categories,
  products,
}: HomePageProps) {
  const heroSellerCta = getSellerCta(sellerStatus);
  const panelSellerCta = getSellerCta(sellerStatus, {
    defaultLabel: "Créer ma boutique",
  });
  const hasSellerStatus = hasSellerProfileStatus(sellerStatus);
  const visibleCategories = categories.slice(0, 12);
  const visibleProducts = products.slice(0, 6);
  const totalProducts = categories.reduce(
    (total, category) => total + category.productCount,
    0,
  );

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className={styles.heroBadge}>
                <i className="bi bi-lightning-charge-fill" aria-hidden="true"></i>
                Marketplace locale basée à {siteConfig.location}
              </div>

              <h1 className={styles.heroTitle}>Achetez et vendez facilement à Sangarédi</h1>
              <p className={styles.heroText}>
                La marketplace locale pour produits, services et bonnes affaires. Trouvez
                rapidement ce qu&apos;il vous faut ou développez votre commerce avec FOOLY.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link href="/boutique" className="btn btn-warning btn-lg">
                  Acheter maintenant <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
                </Link>
                {showSellerEntry && (
                  <Link href={heroSellerCta.href} className="btn btn-outline-dark btn-lg">
                    {heroSellerCta.label}
                  </Link>
                )}
              </div>

              <div className="row g-3 mt-4">
                <div className="col-4">
                  <div className={styles.heroStat}>
                    <strong>{categories.length}</strong>
                    <span>Catégories</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className={styles.heroStat}>
                    <strong>Local</strong>
                    <span>Sangarédi</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className={styles.heroStat}>
                    <strong>{totalProducts}</strong>
                    <span>Produits</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className={styles.heroCard}>
                <Image
                  src="/images/banners/home-hero-marketplace.jpg"
                  alt="Marché local avec vendeurs et produits disponibles sur Marché Fooly"
                  width={1200}
                  height={900}
                  className={styles.coverImage}
                  priority
                  sizes="(max-width: 991px) 100vw, 50vw"
                />
                <div className={styles.heroOverlay}>
                  <div>
                    <strong>Marché Fooly</strong>
                    <span>Produits locaux, vendeurs proches et achats simples à Sangarédi.</span>
                  </div>
                  <Link href="/boutique" className="btn btn-light btn-sm fw-semibold">
                    Explorer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className="container">
          <SectionHeading
            eyebrow="Catégories"
            title="Trouvez vite ce que vous cherchez"
            description="Une organisation claire pour acheter rapidement dans les rayons les plus demandés."
            action={{ href: "/categories", label: "Voir toutes les catégories" }}
          />

          {visibleCategories.length > 0 ? (
            <div className="row g-3">
              {visibleCategories.map((category) => (
                <div key={category.slug} className="col-6 col-md-4 col-lg-3">
                  <Link href={`/boutique?category=${category.slug}`} className={styles.categoryCard}>
                    <span className={styles.categoryIcon}>
                      <i className={category.icon} aria-hidden="true"></i>
                    </span>
                    <h3>{category.name}</h3>
                    <p>{category.shortDescription || category.description}</p>
                  </Link>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {visibleProducts.length > 0 && (
        <section className={`${styles.sectionBlock} ${styles.softSection}`}>
          <div className="container">
            <SectionHeading
              eyebrow="Produits disponibles"
              title="À découvrir sur Marché Fooly"
              description="Des produits publiés par les vendeurs validés de la marketplace."
              action={{ href: "/boutique", label: "Explorer la boutique" }}
            />

            <div className="row g-4">
              {visibleProducts.map((product) => (
                <div key={product.productId} className="col-sm-6 col-xl-4">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={styles.sectionBlock}>
        <div className="container">
          <div className={styles.sellerPanel}>
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <span className={styles.eyebrow}>Vendeurs locaux</span>
                <h2 className={styles.sectionTitle}>
                  {hasSellerStatus
                    ? "Suivez votre boutique FOOLY"
                    : "Vendez en ligne facilement avec FOOLY"}
                </h2>
                <p className={styles.sectionSubtitle}>
                  {hasSellerStatus
                    ? "Retrouvez l'état de votre demande, vos produits et vos commandes dans votre espace vendeur."
                    : "Créez votre boutique et commencez à vendre partout à Sangarédi avec une présence digitale crédible et simple à gérer."}
                </p>
                {showSellerEntry && (
                  <Link href={panelSellerCta.href} className="btn btn-warning btn-lg mt-2">
                    {panelSellerCta.label}
                  </Link>
                )}
              </div>

              <div className="col-lg-6">
                <div className={styles.sellerImageCard}>
                  <Image
                    src="/images/vendors/local-seller.jpg"
                    alt="Vendeur local préparant ses produits pour Marché Fooly"
                    width={1200}
                    height={900}
                    className={styles.coverImage}
                    sizes="(max-width: 991px) 100vw, 50vw"
                  />
                </div>

                <div className="row g-3 mt-1">
                  {sellerFeatures.map((feature) => (
                    <div key={feature.title} className="col-sm-6">
                      <div className={styles.sellerFeature}>
                        <i className={feature.icon} aria-hidden="true"></i>
                        <div>
                          <strong>{feature.title}</strong>
                          <p>{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className="container">
          <SectionHeading
            eyebrow="Comment ça marche"
            title="Trois étapes simples"
            description="Une expérience claire pour les acheteurs comme pour les vendeurs."
            centered
          />

          <div className="row g-4">
            {steps.map((step) => (
              <div key={step.number} className="col-md-4">
                <article className={styles.stepCard}>
                  <div className={styles.stepNumber}>{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.sectionBlock} ${styles.softSection}`}>
        <div className="container">
          <SectionHeading
            eyebrow="Pourquoi FOOLY ?"
            title="Une marketplace pensée pour la confiance"
            description="L'objectif est de rassurer les visiteurs dès les premières secondes et de valoriser les vendeurs locaux."
            centered
          />

          <div className="row g-4 align-items-stretch mb-4">
            <div className="col-lg-7">
              <article className={styles.imageStoryCard}>
                <Image
                  src="/images/banners/local-marketplace.jpg"
                  alt="Marketplace locale Marché Fooly pour acheter et vendre à Sangarédi"
                  width={1400}
                  height={900}
                  className={styles.coverImage}
                  sizes="(max-width: 991px) 100vw, 58vw"
                />
                <div className={styles.imageStoryContent}>
                  <span className={styles.eyebrow}>Sangarédi au centre</span>
                  <h3>Une vitrine locale pour les achats du quotidien</h3>
                  <p>
                    FOOLY met en avant les produits, les services et les commerçants proches des acheteurs.
                  </p>
                </div>
              </article>
            </div>

            <div className="col-lg-5">
              <article className={styles.trustCard}>
                <Image
                  src="/images/banners/trust-delivery.jpg"
                  alt="Livraison locale et retrait vendeur pour les commandes Marché Fooly"
                  width={1000}
                  height={900}
                  className={styles.coverImage}
                  sizes="(max-width: 991px) 100vw, 42vw"
                />
                <div className={styles.trustCardContent}>
                  <i className="bi bi-shield-check" aria-hidden="true"></i>
                  <div>
                    <strong>Confiance et livraison locale</strong>
                    <span>Des commandes plus rassurantes avec des vendeurs identifiés.</span>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="row g-4">
            {reasons.map((reason) => (
              <div key={reason.title} className="col-md-6 col-xl-4">
                <article className={styles.reasonCard}>
                  <i className={`${reason.icon} ${reason.accentClass}`} aria-hidden="true"></i>
                  <h3>{reason.title}</h3>
                  <p>{reason.description}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.newsletterSection}>
        <div className="container">
          <div className={styles.newsletterBox}>
            <div className="row align-items-center g-4">
              <div className="col-lg-6">
                <span className={styles.newsletterEyebrow}>Newsletter</span>
                <h2>Recevez les meilleures offres</h2>
                <p>
                  Promos, nouveautés et bons plans directement dans votre boîte email pour
                  suivre l&apos;actualité du marché local.
                </p>
              </div>
              <div className="col-lg-6">
                <form action="/contact" method="get" className={styles.newsletterForm}>
                  <input type="hidden" name="topic" value="newsletter" />
                  <input
                    type="email"
                    name="email"
                    required
                    className="form-control"
                    placeholder="Votre adresse email"
                    aria-label="Votre adresse email"
                  />
                  <button type="submit" className="btn btn-dark btn-lg">
                    S&apos;inscrire
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
