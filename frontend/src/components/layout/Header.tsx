import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/common/SearchBar";
import { siteConfig } from "@/config/site";
import { hasBackOfficeAccess } from "@/lib/admin";
import { getSellerCta } from "@/lib/sellerCta";
import type { SellerCtaStatus } from "@/lib/sellerCta";
import type { AuthUser } from "@/types/auth";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  { href: "/categories", label: "Catégories" },
  { href: "/contact", label: "Contact" },
] as const;

type HeaderProps = {
  user: AuthUser | null;
  sellerStatus: SellerCtaStatus;
  showSellerEntry: boolean;
};

export default function Header({
  user,
  sellerStatus,
  showSellerEntry,
}: HeaderProps) {
  const hasAdminAccess = user ? hasBackOfficeAccess(user.role) : false;
  const sellerCta = getSellerCta(sellerStatus);

  return (
    <header className="mf-header">
      <div className="container py-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <Link href="/" className="d-inline-flex align-items-center gap-2">
            <span className="mf-logo-mark">
              <Image
                src="/images/logo/marche-fooly-logo.jpeg"
                alt={`Logo ${siteConfig.name}`}
                width={48}
                height={48}
                style={{ display: "block" }}
                priority
              />
            </span>
            <div>
              <strong className="d-block lh-1" style={{ fontSize: "1.15rem", letterSpacing: "-0.03em" }}>
                {siteConfig.name}
              </strong>
              <span className="small" style={{ color: "var(--mf-muted)", fontWeight: 700 }}>
                {siteConfig.slogan}
              </span>
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

        <nav className="mf-nav" aria-label="Navigation principale">
          <ul className="d-flex flex-wrap list-unstyled mb-0" style={{ gap: "0.25rem" }}>
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
            {showSellerEntry && (
              <li>
                <Link href={sellerCta.href}>
                  {sellerCta.label}
                </Link>
              </li>
            )}
            {hasAdminAccess && (
              <li>
                <Link href="/admin">
                  Administration
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
