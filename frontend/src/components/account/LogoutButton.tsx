/**
 * Composant: LogoutButton (Client Component)
 *
 * Rôle du fichier :
 *   Bouton « Déconnexion ». Appelle le Route Handler interne
 *   POST /api/auth/logout, qui notifie le backend puis SUPPRIME le
 *   cookie de session httpOnly.
 *
 * Où il est utilisé :
 *   - components/account/AccountSidebar.tsx (visible uniquement quand
 *     un utilisateur est connecté).
 *
 * Règles de sécurité :
 *   - Aucun token n'est manipulé ici : la suppression du cookie est
 *     faite côté serveur par le Route Handler.
 *   - Après déconnexion : router.refresh() pour que les Server
 *     Components relisent l'état (cookie supprimé -> vue visiteur).
 *
 * Note pour GitHub Copilot :
 *   - Composant client minimal : il existe parce qu'un onClick est
 *     nécessaire ; AccountSidebar reste, lui, un Server Component.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/account.module.css";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Échec réseau ignoré : on rafraîchit quand même la vue.
    }
    router.push("/mon-compte");
    router.refresh();
  }

  return (
    <button
      type="button"
      className={styles.sidebarLogout}
      onClick={handleLogout}
      disabled={loading}
    >
      <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
      {loading ? "Déconnexion…" : "Déconnexion"}
    </button>
  );
}
