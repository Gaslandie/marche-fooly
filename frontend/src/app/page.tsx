import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <section className="container py-5">
      <h1 className="fw-bold mb-2">{siteConfig.name}</h1>
      <p className="text-muted mb-4">{siteConfig.slogan}</p>
      <div className="d-flex flex-wrap gap-2">
        <Link href="/boutique" className="btn btn-warning">
          Voir la boutique
        </Link>
        <Link href="/categories" className="btn btn-outline-dark">
          Parcourir les catégories
        </Link>
      </div>
    </section>
  );
}
