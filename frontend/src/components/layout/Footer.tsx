import Link from "next/link";
import Newsletter from "@/components/common/Newsletter";
import { siteConfig } from "@/config/site";

const shopLinks = [
  { href: "/boutique", label: "Boutique" },
  { href: "/categories", label: "Catégories" },
  { href: "/panier", label: "Mon panier" },
  { href: "/favoris", label: "Mes favoris" },
  { href: "/devenir-vendeur", label: "Devenir vendeur" },
] as const;

const accountLinks = [
  { href: "/mon-compte", label: "Mon compte" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/aide", label: "Centre d'aide" },
  { href: "/contact", label: "Contact" },
] as const;

export default function Footer() {
  return (
    <footer className="mf-footer mt-auto">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-3">
            <h5 className="mb-2">{siteConfig.name}</h5>
            <p className="text-muted mb-2">{siteConfig.slogan}</p>
            <p className="text-muted mb-0">{siteConfig.location}</p>
          </div>

          <div className="col-md-3">
            <h5 className="mb-3">Marketplace</h5>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              {shopLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-md-2">
            <h5 className="mb-3">Mon espace</h5>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              {accountLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-md-4">
            <Newsletter />
          </div>
        </div>

        <hr className="my-4" />

        <div className="d-flex flex-wrap justify-content-between gap-2 small">
          <div className="d-flex flex-wrap gap-3">
            <a href={siteConfig.phoneHref}>{siteConfig.phone}</a>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            <a href={siteConfig.whatsappHref} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </div>
          <p className="mb-0">© {new Date().getFullYear()} {siteConfig.name}</p>
        </div>
      </div>
    </footer>
  );
}
