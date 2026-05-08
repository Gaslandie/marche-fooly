import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
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

type Category = {
  icon: string;
  title: string;
  description: string;
};

type Product = {
  badge?: string;
  icon: string;
  title: string;
  price: string;
  rating: number;
  reviews: number;
  href: string;
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

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  rating: number;
};

const categories: Category[] = [
  { icon: "bi bi-basket2", title: "Alimentation", description: "Produits du quotidien" },
  { icon: "bi bi-car-front", title: "Automobile", description: "Accessoires et pièces" },
  { icon: "bi bi-balloon-heart", title: "Bébé & maternité", description: "Soins et accessoires" },
  { icon: "bi bi-tv", title: "Électroménagers", description: "Équipements maison" },
  { icon: "bi bi-pencil-square", title: "Fournitures scolaires", description: "Bureau et école" },
  { icon: "bi bi-music-note-beamed", title: "Instruments de musique", description: "Son et création" },
  { icon: "bi bi-controller", title: "Livres & jeux", description: "Loisirs pour tous" },
  { icon: "bi bi-house-heart", title: "Maison & cuisine", description: "Confort quotidien" },
  { icon: "bi bi-lamp", title: "Meubles", description: "Décoration et mobilier" },
  { icon: "bi bi-gem", title: "Sacs & bijoux", description: "Accessoires mode" },
  { icon: "bi bi-phone", title: "Téléphones", description: "Mobiles et accessoires" },
  { icon: "bi bi-person-standing-dress", title: "Vêtements", description: "Femme, homme, enfant" },
];

const popularProducts: Product[] = [
  {
    badge: "Populaire",
    icon: "bi bi-phone",
    title: "Téléphone Samsung A12",
    price: "1 200 000 GNF",
    rating: 4.5,
    reviews: 24,
    href: "/produit/samsung-a12",
  },
  {
    badge: "Promo",
    icon: "bi bi-router",
    title: "Routeur Wi-Fi",
    price: "350 000 GNF",
    rating: 4,
    reviews: 18,
    href: "/boutique",
  },
  {
    icon: "bi bi-droplet-half",
    title: "Huile de soin",
    price: "120 000 GNF",
    rating: 5,
    reviews: 32,
    href: "/boutique",
  },
  {
    badge: "Nouveau",
    icon: "bi bi-house-door",
    title: "Location maison",
    price: "12 000 000 GNF",
    rating: 4,
    reviews: 9,
    href: "/boutique",
  },
  {
    badge: "Top",
    icon: "bi bi-display",
    title: "Télévision HD",
    price: "2 500 000 GNF",
    rating: 4.5,
    reviews: 14,
    href: "/boutique",
  },
  {
    badge: "Local",
    icon: "bi bi-bag-heart",
    title: "Sac tendance femme",
    price: "85 000 GNF",
    rating: 4,
    reviews: 21,
    href: "/boutique",
  },
];

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

const testimonials: Testimonial[] = [
  {
    quote: "Une marketplace comme celle-ci aide vraiment les commerçants de Sangarédi à vendre plus facilement.",
    author: "Mamadou B.",
    role: "Vendeur local",
    rating: 5,
  },
  {
    quote: "Le site est simple, clair et donne envie d'acheter. Les catégories sont faciles à parcourir.",
    author: "Aïssatou D.",
    role: "Cliente",
    rating: 4.5,
  },
  {
    quote: "FOOLY peut devenir une vraie vitrine digitale pour les boutiques locales et les indépendants.",
    author: "Ibrahima S.",
    role: "Commerçant",
    rating: 5,
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

function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;

    if (rating >= starValue) {
      return "bi bi-star-fill";
    }

    if (rating >= starValue - 0.5) {
      return "bi bi-star-half";
    }

    return "bi bi-star";
  });

  return (
    <div className={styles.rating} aria-label={`Note ${rating} sur 5`}>
      {stars.map((iconClass, index) => (
        <i key={`${iconClass}-${index}`} className={iconClass} aria-hidden="true"></i>
      ))}
      {reviews > 0 ? <span className={styles.reviewCount}>({reviews})</span> : null}
    </div>
  );
}

export default function HomePage() {
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
                <Link href="/devenir-vendeur" className="btn btn-outline-dark btn-lg">
                  Devenir vendeur
                </Link>
              </div>

              <div className="row g-3 mt-4">
                <div className="col-4">
                  <div className={styles.heroStat}>
                    <strong>+14</strong>
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
                    <strong>24/7</strong>
                    <span>Boutique en ligne</span>
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

          <div className="row g-3">
            {categories.map((category) => (
              <div key={category.title} className="col-6 col-md-4 col-lg-3">
                <Link href="/categories" className={styles.categoryCard}>
                  <span className={styles.categoryIcon}>
                    <i className={category.icon} aria-hidden="true"></i>
                  </span>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.sectionBlock} ${styles.softSection}`}>
        <div className="container">
          <SectionHeading
            eyebrow="Produits populaires"
            title="Les bonnes affaires du moment"
            description="Des sélections temporaires pour présenter les produits les plus consultés de la marketplace."
            action={{ href: "/boutique", label: "Explorer la boutique" }}
          />

          <div className="row g-4">
            {popularProducts.map((product) => (
              <div key={product.title} className="col-sm-6 col-xl-4">
                <article className={styles.productCard}>
                  <div className={styles.productMedia}>
                    {product.badge ? <span className={styles.productBadge}>{product.badge}</span> : null}
                    <i className={product.icon} aria-hidden="true"></i>
                  </div>
                  <div className={styles.productBody}>
                    <h3>{product.title}</h3>
                    <Rating rating={product.rating} reviews={product.reviews} />
                    <div className={styles.productPrice}>{product.price}</div>
                    <div className={styles.productActions}>
                      <Link href="/panier" className="btn btn-warning btn-sm">
                        Ajouter
                      </Link>
                      <Link href={product.href} className="btn btn-outline-dark btn-sm">
                        Voir
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className="container">
          <div className={styles.sellerPanel}>
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <span className={styles.eyebrow}>Vendeurs locaux</span>
                <h2 className={styles.sectionTitle}>Vendez en ligne facilement avec FOOLY</h2>
                <p className={styles.sectionSubtitle}>
                  Créez votre boutique et commencez à vendre partout à Sangarédi avec une
                  présence digitale crédible et simple à gérer.
                </p>
                <Link href="/devenir-vendeur" className="btn btn-warning btn-lg mt-2">
                  Créer ma boutique
                </Link>
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

      <section className={styles.sectionBlock}>
        <div className="container">
          <SectionHeading
            eyebrow="Témoignages"
            title="Ils font confiance à FOOLY"
            description="Des retours qui renforcent la crédibilité de la marketplace locale."
            centered
          />

          <div className="row g-4">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author} className="col-md-4">
                <article className={styles.testimonialCard}>
                  <Rating rating={testimonial.rating} reviews={0} />
                  <p>{`“${testimonial.quote}”`}</p>
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
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
