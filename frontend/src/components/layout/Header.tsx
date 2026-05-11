import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/common/SearchBar";
import { siteConfig } from "@/config/site";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  { href: "/categories", label: "Catégories" },
  { href: "/devenir-vendeur", label: "Devenir vendeur" },
  { href: "/contact", label: "Contact" },
] as const;

export default function Header() {
  return (
    <header className="mf-header border-bottom">
      <div className="container py-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <Link href="/" className="d-inline-flex align-items-center gap-2">
            <Image
              src="/images/logo/marche-fooly-logo.jpeg"
              alt={`Logo ${siteConfig.name}`}
              width={48}
              height={48}
              className="rounded-circle"
              priority
            />
            <div>
              <strong className="d-block lh-1">{siteConfig.name}</strong>
              <span className="small text-muted">{siteConfig.slogan}</span>
            </div>
          </Link>

          <div className="mf-header-search">
            <SearchBar />
          </div>

          <div className="d-flex align-items-center gap-3">
            <Link href="/favoris" className="mf-icon-link" aria-label="Mes favoris">
              <i className="bi bi-heart" aria-hidden="true"></i>
            </Link>
            <Link href="/panier" className="mf-icon-link" aria-label="Panier">
              <i className="bi bi-cart3" aria-hidden="true"></i>
            </Link>
            <Link href="/mon-compte" className="mf-icon-link" aria-label="Mon compte">
              <i className="bi bi-person-circle" aria-hidden="true"></i>
            </Link>
          </div>
        </div>

        <nav className="mf-nav mt-3" aria-label="Navigation principale">
          <ul className="d-flex flex-wrap gap-3 list-unstyled mb-0">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="fw-medium">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
