/**
 * Composant: AccountSidebar (Server Component)
 *
 * Rôle du fichier :
 *   Colonne latérale de la page /mon-compte : profil de l'utilisateur
 *   connecté, navigation du compte et bouton de déconnexion.
 *
 * Où il est utilisé :
 *   - app/mon-compte/page.tsx (rendu uniquement quand un utilisateur
 *     est connecté ; reçoit `user` en prop).
 *
 * Prérequis / infos utiles :
 *   - Reste un Server Component : il affiche des données déjà
 *     récupérées côté serveur. Seul le bouton de déconnexion est
 *     interactif et délégué au Client Component <LogoutButton/>.
 *
 * Note pour GitHub Copilot :
 *   - `user` est garanti non-null : la page n'affiche cette sidebar
 *     que pour un utilisateur authentifié.
 */

import Link from "next/link";
import LogoutButton from "@/components/account/LogoutButton";
import type { AuthUser } from "@/types/auth";
import styles from "@/styles/account.module.css";

const NAV_LINKS = [
  { icon: "bi bi-person", label: "Mon profil", href: "/mon-compte", active: true },
  { icon: "bi bi-bag", label: "Mes commandes", href: "/commandes", active: false },
  { icon: "bi bi-heart", label: "Mes favoris", href: "/favoris", active: false },
  { icon: "bi bi-bell", label: "Notifications", href: "/mon-compte", active: false },
  { icon: "bi bi-shield-check", label: "Sécurité", href: "/mon-compte", active: false },
];

type AccountSidebarProps = {
  user: AuthUser;
};

export default function AccountSidebar({ user }: AccountSidebarProps) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initial = (user.firstName || user.email).charAt(0).toUpperCase();

  return (
    <div className={styles.sidebar}>
      {/* Profile header */}
      <div className={styles.sidebarProfile}>
        <div className={styles.avatarCircle}>{initial}</div>
        <p className={styles.sidebarName}>{fullName}</p>
        <p className={styles.sidebarEmail}>{user.email}</p>
      </div>

      {/* Nav */}
      <nav className={styles.sidebarNav} aria-label="Navigation du compte">
        {NAV_LINKS.map(({ icon, label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`${styles.sidebarLink} ${active ? styles.sidebarLinkActive : ""}`}
          >
            <i className={icon} aria-hidden="true"></i>
            {label}
          </Link>
        ))}

        {/* Lien espace vendeur : visible seulement pour les comptes vendeur.
            (L'accès réel est de toute façon revalidé côté serveur sur le
            statut du profil vendeur dans /vendeur.) */}
        {user.role === "seller" && (
          <Link
            href="/vendeur"
            className={styles.sidebarLink}
          >
            <i className="bi bi-shop" aria-hidden="true"></i>
            Espace vendeur
          </Link>
        )}

        {/* Lien espace admin : visible seulement pour les comptes admin.
            (L'accès réel est revalidé serveur + backend requireRole.) */}
        {user.role === "admin" && (
          <Link href="/admin" className={styles.sidebarLink}>
            <i className="bi bi-shield-lock" aria-hidden="true"></i>
            Espace admin
          </Link>
        )}

        <div className={styles.sidebarDivider} />

        <LogoutButton />
      </nav>
    </div>
  );
}
