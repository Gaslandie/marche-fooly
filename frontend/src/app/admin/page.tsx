/**
 * Route: app/admin/page
 *
 * Rôle du fichier :
 *   Vue d'ensemble de l'espace d'administration. Server Component protégé
 *   par rôle. Affiche des compteurs simples (users/vendeurs/produits/
 *   commandes + vendeurs en attente) et des liens vers les listes.
 *
 * Sécurité (IMPORTANT) :
 *   - non connecté         -> redirect("/mon-compte")
 *   - user.role !== "admin" -> redirect("/")
 *   La protection UI ne suffit jamais : le backend impose aussi
 *   `requireRole("admin")` sur /api/admin/* (défense en profondeur).
 *   - `dynamic = "force-dynamic"` : dépend du cookie de session.
 *   - JWT jamais exposé (fetchs serveur via cookie httpOnly).
 *
 * Note pour GitHub Copilot :
 *   - Compteurs obtenus via `pagination.total` (fetch `{ limit: 1 }`).
 *   - `null` = échec de chargement -> affiché « — ».
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAdminOrders,
  getAdminProducts,
  getAdminSellers,
  getAdminUsers,
} from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Administration",
  description: "Supervision de la marketplace Marché Fooly.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/mon-compte");
  if (user.role !== "admin") redirect("/");

  const [users, sellers, pendingSellers, products, orders] = await Promise.all([
    getAdminUsers({ limit: 1 }),
    getAdminSellers({ limit: 1 }),
    getAdminSellers({ status: "pending", limit: 1 }),
    getAdminProducts({ limit: 1 }),
    getAdminOrders({ limit: 1 }),
  ]);

  const total = (r: { pagination: { total: number } } | null) =>
    r ? r.pagination.total : null;
  const fmt = (n: number | null) => (n === null ? "—" : n);

  const pendingCount = total(pendingSellers);

  const sections = [
    {
      href: "/admin/utilisateurs",
      icon: "bi bi-people",
      label: "Utilisateurs",
      value: fmt(total(users)),
    },
    {
      href: "/admin/vendeurs",
      icon: "bi bi-shop",
      label: "Vendeurs",
      value: fmt(total(sellers)),
      note:
        pendingCount && pendingCount > 0
          ? `${pendingCount} en attente`
          : undefined,
    },
    {
      href: "/admin/produits",
      icon: "bi bi-box-seam",
      label: "Produits",
      value: fmt(total(products)),
    },
    {
      href: "/admin/commandes",
      icon: "bi bi-receipt",
      label: "Commandes",
      value: fmt(total(orders)),
    },
  ];

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/mon-compte">Mon compte</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Administration
          </li>
        </ol>
      </nav>

      <div className="mb-4">
        <span
          className="fw-bold"
          style={{ color: "var(--mf-orange)", fontSize: "0.875rem" }}
        >
          <i className="bi bi-shield-lock me-1" aria-hidden="true"></i>
          Supervision
        </span>
        <h1 className="h3 fw-bold mb-0">Administration</h1>
      </div>

      <div className="row g-3">
        {sections.map((s) => (
          <div key={s.href} className="col-sm-6 col-lg-3">
            <Link
              href={s.href}
              className="text-decoration-none text-reset d-block bg-white rounded-3 shadow-sm p-4 h-100"
            >
              <i
                className={`${s.icon} fs-2 mb-2 d-block`}
                style={{ color: "var(--mf-orange)" }}
                aria-hidden="true"
              ></i>
              <div className="fw-bold fs-4">{s.value}</div>
              <div className="text-secondary">{s.label}</div>
              {s.note && (
                <span className="badge bg-warning text-dark mt-2">{s.note}</span>
              )}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
