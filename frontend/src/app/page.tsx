import Image from "next/image";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="d-flex flex-column min-vh-100 align-items-center justify-content-center bg-light">
      <div className="text-center p-4">
        <Image
          src="/images/logo/marche-fooly-logo.jpeg"
          alt={`Logo ${siteConfig.name}`}
          width={120}
          height={120}
          className="rounded-circle mb-4 shadow-sm"
          priority
        />
        <h1 className="fw-bold mb-1" style={{ color: "var(--mf-orange)" }}>
          {siteConfig.name}
        </h1>
        <p className="text-muted fs-5 mb-4">{siteConfig.slogan}</p>
        <div className="d-flex flex-column gap-2 text-muted small">
          <span>
            <i className="bi bi-geo-alt-fill me-1" style={{ color: "var(--mf-orange)" }}></i>
            {siteConfig.location}
          </span>
          <span>
            <i className="bi bi-telephone-fill me-1" style={{ color: "var(--mf-green)" }}></i>
            <a href={siteConfig.phoneHref} className="text-muted">
              {siteConfig.phone}
            </a>
          </span>
          <span>
            <i className="bi bi-envelope-fill me-1" style={{ color: "var(--mf-blue)" }}></i>
            <a href={`mailto:${siteConfig.email}`} className="text-muted">
              {siteConfig.email}
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
