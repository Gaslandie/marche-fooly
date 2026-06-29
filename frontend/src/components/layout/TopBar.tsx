import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getSellerCta } from "@/lib/sellerCta";
import type { SellerCtaStatus } from "@/lib/sellerCta";

type TopBarProps = {
  sellerStatus: SellerCtaStatus;
  showSellerEntry: boolean;
};

export default function TopBar({
  sellerStatus,
  showSellerEntry,
}: TopBarProps) {
  const sellerCta = getSellerCta(sellerStatus);

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
          {showSellerEntry && (
            <Link href={sellerCta.href}>{sellerCta.label}</Link>
          )}
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </div>
  );
}
