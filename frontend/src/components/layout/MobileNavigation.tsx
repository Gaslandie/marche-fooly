"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/common/SearchBar";
import { useCart } from "@/components/cart/CartProvider";
import type { SellerCta } from "@/lib/sellerCta";
import type { CategoryItem } from "@/types/catalog";
import styles from "@/styles/mobileNavigation.module.css";

type Props = {
  categories: Pick<CategoryItem, "slug" | "name" | "icon">[];
  isAuthenticated: boolean;
  hasAdminAccess: boolean;
  sellerCta: SellerCta | null;
  unreadNotifications: number;
};

export default function MobileNavigation({
  categories,
  isAuthenticated,
  hasAdminAccess,
  sellerCta,
  unreadNotifications,
}: Props) {
  const [panel, setPanel] = useState<"search" | "menu" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { totalQuantity } = useCart();

  useEffect(() => {
    if (panel === "search") searchRef.current?.querySelector("input")?.focus();
    if (!panel) return;

    const close = () => setPanel(null);
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const desktop = window.matchMedia("(min-width: 992px)");
    const resize = () => { if (desktop.matches) close(); };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("popstate", close);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("popstate", close);
      desktop.removeEventListener("change", resize);
    };
  }, [panel]);

  const links = [
    { href: "/", label: "Accueil", icon: "bi bi-house" },
    { href: "/boutique", label: "Boutique", icon: "bi bi-shop-window" },
    { href: "/mon-compte", label: "Mon compte", icon: "bi bi-person-circle" },
    { href: "/panier", label: "Panier", icon: "bi bi-cart3", count: totalQuantity },
    {
      href: isAuthenticated ? "/favoris" : "/mon-compte?retour=/favoris",
      label: "Favoris", icon: "bi bi-heart",
    },
    ...(isAuthenticated ? [{ href: "/notifications", label: "Notifications", icon: "bi bi-bell", count: unreadNotifications }] : []),
    { href: "/contact", label: "Contact", icon: "bi bi-chat-dots" },
    ...(sellerCta ? [sellerCta] : []),
    ...(hasAdminAccess ? [{ href: "/admin", label: "Administration", icon: "bi bi-shield-lock" }] : []),
  ];

  return (
    <div
      className={styles.root}
      ref={rootRef}
      onKeyDown={(event) => {
        if (event.key === "Escape" && panel) {
          event.preventDefault();
          (panel === "search" ? searchButtonRef : menuButtonRef).current?.focus();
          setPanel(null);
        }
      }}
    >
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.toggle}
          ref={searchButtonRef}
          aria-label={panel === "search" ? "Fermer la recherche" : "Ouvrir la recherche"}
          aria-expanded={panel === "search"}
          aria-controls="mobile-search"
          onClick={() => setPanel(panel === "search" ? null : "search")}
        >
          <i className={`bi ${panel === "search" ? "bi-x-lg" : "bi-search"}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.toggle}
          ref={menuButtonRef}
          aria-label={panel === "menu" ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={panel === "menu"}
          aria-controls="mobile-menu"
          onClick={() => setPanel(panel === "menu" ? null : "menu")}
        >
          <i className={`bi ${panel === "menu" ? "bi-x-lg" : "bi-list"}`} aria-hidden="true" />
        </button>
      </div>
      <div id="mobile-search" className={styles.panel} hidden={panel !== "search"} ref={searchRef}>
        <SearchBar />
      </div>
      <nav id="mobile-menu" className={styles.panel} hidden={panel !== "menu"} aria-label="Navigation mobile">
        <details className={styles.categories}>
          <summary>
            <i className="bi bi-grid" aria-hidden="true" />
            Catégories
            <i className={`bi bi-chevron-down ${styles.chevron}`} aria-hidden="true" />
          </summary>
          <ul className={styles.categoryLinks}>
            <li>
              <Link href="/categories" onNavigate={() => setPanel(null)}>
                Toutes les catégories
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/boutique?category=${encodeURIComponent(category.slug)}`}
                  onNavigate={() => setPanel(null)}
                >
                  <i className={category.icon} aria-hidden="true" />
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                onNavigate={() => setPanel(null)}
              >
                <i className={link.icon} aria-hidden="true" />
                <span>{link.label}</span>
                {"count" in link && typeof link.count === "number" && link.count > 0 && (
                  <span className={styles.count}>{link.count > 99 ? "99+" : link.count}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
