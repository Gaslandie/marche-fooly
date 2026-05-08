import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function TopBar() {
  return (
    <div className="mf-topbar">
      <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 small">
        <div className="d-flex flex-wrap gap-3">
          <a href={siteConfig.phoneHref}>
            <i className="bi bi-telephone-fill me-1" aria-hidden="true"></i>
            {siteConfig.phone}
          </a>
          <a href={`mailto:${siteConfig.email}`}>
            <i className="bi bi-envelope-fill me-1" aria-hidden="true"></i>
            {siteConfig.email}
          </a>
          <a href={siteConfig.whatsappHref} target="_blank" rel="noopener noreferrer">
            <i className="bi bi-whatsapp me-1" aria-hidden="true"></i>
            WhatsApp
          </a>
        </div>
        <div className="d-flex flex-wrap gap-3">
          <Link href="/devenir-vendeur">Devenir vendeur</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </div>
  );
}
