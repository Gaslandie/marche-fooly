/**
 * Route: app/checkout/page
 *
 * Rôle du fichier :
 *   Page de finalisation de commande. Protégée côté serveur :
 *     - utilisateur non connecté -> redirect("/mon-compte?retour=/checkout")
 *   Pré-charge l'utilisateur et le passe au `CheckoutForm` (Client) qui
 *   se charge de la logique métier (panier via useCart, soumission via
 *   /api/orders).
 *
 * Sécurité :
 *   - `getCurrentUser()` valide la session côté serveur.
 *   - `dynamic = "force-dynamic"` : la page dépend du cookie de session.
 *   - L'état du panier (panier vide -> notice + retour /panier) est géré
 *     côté client par CheckoutForm/OrderSummary (le panier vit en
 *     localStorage, invisible côté serveur).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import { getCurrentUser } from "@/lib/auth";
import styles from "@/styles/checkout.module.css";
import catalogStyles from "@/styles/catalog.module.css";

export const metadata: Metadata = {
  title: "Finaliser ma commande",
  description:
    "Complétez vos informations et choisissez votre mode de paiement pour finaliser votre achat sur Marché Fooly à Sangarédi.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/mon-compte?retour=/checkout");
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.checkoutHero}>
        <div className="container">
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/" className={styles.breadcrumbLink}>
                  Accueil
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/panier" className={styles.breadcrumbLink}>
                  Panier
                </Link>
              </li>
              <li
                className={`breadcrumb-item active ${styles.breadcrumbCurrent}`}
                aria-current="page"
              >
                Paiement
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className={catalogStyles.heroBadge}>
                <i className="bi bi-bag-check" aria-hidden="true"></i>
                Dernière étape
              </span>
              <h1 className={`${styles.checkoutTitle} mb-3`}>
                Finaliser ma commande
              </h1>
              <p className="fs-5 mb-0" style={{ color: "rgba(255,255,255,0.75)" }}>
                Renseignez vos informations et confirmez votre commande auprès des vendeurs locaux.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link href="/panier" className="btn btn-outline-light">
                <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
                Retour au panier
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Checkout content ──────────────────────────────────────── */}
      <section className={styles.checkoutPage}>
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <CheckoutForm user={user} />
            </div>
            <div className="col-lg-4">
              <OrderSummary />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
