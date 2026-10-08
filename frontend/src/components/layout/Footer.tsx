import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getSellerCta } from "@/lib/sellerCta";
import type { SellerCtaStatus } from "@/lib/sellerCta";

const shopLinks = [
  { href: "/boutique", label: "Boutique" },
  { href: "/categories", label: "Catégories" },
  { href: "/panier", label: "Mon panier" },
  { href: "/favoris", label: "Mes favoris" },
] as const;

const accountLinks = [
  { href: "/mon-compte", label: "Mon compte" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/aide", label: "Centre d'aide" },
  { href: "/contact", label: "Contact" },
] as const;

type FooterProps = {
  isAuthenticated: boolean;
  sellerStatus: SellerCtaStatus;
  showSellerEntry: boolean;
};

export default function Footer({
  isAuthenticated,
  sellerStatus,
  showSellerEntry,
}: FooterProps) {
  const sellerCta = getSellerCta(sellerStatus);

  return (
    <footer className="mf-footer mt-auto text-center text-md-start">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-4">
            <h2 className="h5 mb-2">{siteConfig.name}</h2>
            <p className="text-muted mb-2">{siteConfig.slogan}</p>
            <p className="text-muted mb-0">{siteConfig.location}</p>
          </div>

          <div className="col-md-4">
            <h2 className="h5 mb-3">Marketplace</h2>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              {shopLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={
                      item.href === "/favoris" && !isAuthenticated
                        ? "/mon-compte?retour=/favoris"
                        : item.href
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {showSellerEntry && (
                <li>
                  <Link href={sellerCta.href}>{sellerCta.label}</Link>
                </li>
              )}
            </ul>
          </div>

          <div className="col-md-4">
            <h2 className="h5 mb-3">Mon espace</h2>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              {accountLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-4" />

        <div className="d-flex flex-column flex-md-row flex-wrap align-items-center align-items-md-start justify-content-md-between gap-2 small">
          <div className="d-flex flex-column flex-md-row flex-wrap align-items-center align-items-md-start gap-3">
            <a href={siteConfig.phoneHref}>{siteConfig.phone}</a>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            <a href={siteConfig.whatsappHref} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </div>
          <div className="text-md-end">
            <p className="mb-0">© {new Date().getFullYear()} {siteConfig.name}</p>
            <p className="mb-0 mt-1">Site réalisé par GassTech Solutions</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
