import Link from "next/link";
import styles from "@/styles/account.module.css";

const NAV_LINKS = [
  { icon: "bi bi-person", label: "Mon profil", href: "/mon-compte", active: true },
  { icon: "bi bi-bag", label: "Mes commandes", href: "/commandes", active: false },
  { icon: "bi bi-heart", label: "Mes favoris", href: "/favoris", active: false },
  { icon: "bi bi-bell", label: "Notifications", href: "/mon-compte", active: false },
  { icon: "bi bi-shield-check", label: "Sécurité", href: "/mon-compte", active: false },
];

export default function AccountSidebar() {
  return (
    <div className={styles.sidebar}>
      {/* Profile header */}
      <div className={styles.sidebarProfile}>
        <div className={styles.avatarCircle}>M</div>
        <p className={styles.sidebarName}>Mamadou Diallo</p>
        <p className={styles.sidebarEmail}>mamadou@exemple.com</p>
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

        <div className={styles.sidebarDivider} />

        <button type="button" className={styles.sidebarLogout}>
          <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
          Déconnexion
        </button>
      </nav>
    </div>
  );
}
