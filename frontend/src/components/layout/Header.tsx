import Image from "next/image";
import Link from "next/link";
import CartIcon from "@/components/cart/CartIcon";
import SearchBar from "@/components/common/SearchBar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { siteConfig } from "@/config/site";
import { hasBackOfficeAccess } from "@/lib/admin";
import { getSellerCta } from "@/lib/sellerCta";
import type { SellerCtaStatus } from "@/lib/sellerCta";
import type { AuthUser } from "@/types/auth";
import type { CategoryItem } from "@/types/catalog";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  { href: "/categories", label: "Catégories" },
  { href: "/contact", label: "Contact" },
] as const;

type HeaderProps = {
  categories: CategoryItem[];
  user: AuthUser | null;
  sellerStatus: SellerCtaStatus;
  showSellerEntry: boolean;
  unreadNotifications: number;
};

export default function Header({
  categories,
  user,
  sellerStatus,
  showSellerEntry,
  unreadNotifications,
}: HeaderProps) {
  const hasAdminAccess = user ? hasBackOfficeAccess(user.role) : false;
  const sellerCta = getSellerCta(sellerStatus);

  return (
    <header className="mf-header">
      <div className="container py-3">
        <div className="mf-header-row">
          <Link href="/" className="mf-header-brand d-inline-flex align-items-center gap-2">
            <span className="mf-logo-mark">
              <Image
                src="/images/logo/marche-fooly-logo.jpeg"
                alt={`Logo ${siteConfig.name}`}
                width={48}
                height={48}
                style={{ display: "block" }}
                loading="eager"
              />
            </span>
            <div>
              <strong className="mf-brand-name d-block lh-1">
                {siteConfig.name}
              </strong>
              <span className="small" style={{ color: "var(--mf-muted)", fontWeight: 700 }}>
                {siteConfig.slogan}
              </span>
            </div>
          </Link>

          <div className="mf-header-search d-none d-lg-block">
            <SearchBar />
          </div>

          <div className="d-none d-lg-flex align-items-center gap-3">
            {user && (
              <Link
                href="/notifications"
                className="mf-icon-link"
                aria-label={
                  unreadNotifications > 0
                    ? `${unreadNotifications} notifications non lues`
                    : "Notifications"
                }
              >
                <i className="bi bi-bell" aria-hidden="true"></i>
                {unreadNotifications > 0 && (
                  <span className="mf-icon-badge">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Link>
            )}
            <Link
              href={user ? "/favoris" : "/mon-compte?retour=/favoris"}
              className="mf-icon-link"
              aria-label="Mes favoris"
            >
              <i className="bi bi-heart" aria-hidden="true"></i>
            </Link>
            <CartIcon />
            <Link href="/mon-compte" className="mf-icon-link" aria-label="Mon compte">
              <i className="bi bi-person-circle" aria-hidden="true"></i>
            </Link>
          </div>
          <MobileNavigation
            categories={categories.map(({ slug, name, icon }) => ({ slug, name, icon }))}
            isAuthenticated={Boolean(user)}
            hasAdminAccess={hasAdminAccess}
            sellerCta={showSellerEntry ? sellerCta : null}
            unreadNotifications={unreadNotifications}
          />
        </div>

        <nav className="mf-nav d-none d-lg-block" aria-label="Navigation principale">
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
        <nav className="mf-category-nav d-none d-lg-block" aria-label="Rayons du catalogue">
          <ul>
            <li>
              <Link href="/categories">
                <i className="bi bi-grid me-2" aria-hidden="true" />
                Toutes les catégories
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/boutique?category=${encodeURIComponent(category.slug)}`}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
