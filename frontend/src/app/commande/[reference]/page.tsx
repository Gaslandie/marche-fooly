/**
 * Route: app/commande/[reference]/page
 *
 * Rôle du fichier :
 *   Page de confirmation après création d'une commande. Affiche le récap
 *   serveur (référence, statut, items, total, mode de paiement, adresse,
 *   vendeur). Récupère la commande via lib/orders.ts qui appelle le
 *   backend avec le JWT lu dans le cookie httpOnly.
 *
 * Sécurité :
 *   - Protection serveur : sans utilisateur connecté -> redirect /mon-compte.
 *   - Si la commande est introuvable OU n'appartient pas à l'utilisateur,
 *     `getOrderByReference` renvoie null -> notFound() (404). On NE révèle
 *     PAS l'existence d'une commande qui ne nous appartient pas
 *     (alignement avec la stratégie backend 404-not-403).
 *   - `dynamic = "force-dynamic"` : dépend du cookie de session et de
 *     l'état serveur de la commande.
 *
 * Note pour GitHub Copilot :
 *   - Le `params` de Next 15+ est une Promise -> await obligatoire.
 *   - On affiche les libellés français pour `status`, `paymentMethod`,
 *     `fulfillmentMethod` (le backend stocke des codes).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderByReference } from "@/lib/orders";
import { formatPrice } from "@/utils/formatPrice";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ reference: string }>;
};

export const metadata: Metadata = {
  title: "Commande confirmée",
  description: "Récapitulatif de votre commande passée sur Marché Fooly.",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée par le vendeur",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const PAYMENT_LABEL: Record<string, string> = {
  cash_on_delivery: "Paiement à la livraison",
  pay_on_pickup: "Paiement au retrait",
};

const FULFILLMENT_LABEL: Record<string, string> = {
  home_delivery: "Livraison à domicile",
  seller_pickup: "Retrait en boutique",
};

function getSellerName(seller: unknown): string {
  if (seller && typeof seller === "object" && "storeName" in seller) {
    return String((seller as { storeName: unknown }).storeName);
  }
  return "Vendeur Marché Fooly";
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/mon-compte");

  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order) notFound();

  const isPickup = order.fulfillmentMethod === "seller_pickup";
  const statusLabel = STATUS_LABEL[order.status] ?? order.status;
  const paymentLabel = PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod;
  const fulfillmentLabel =
    FULFILLMENT_LABEL[order.fulfillmentMethod] ?? order.fulfillmentMethod;
  const sellerName = getSellerName(order.seller);

  return (
    <>
      <section className="container py-5">
        <nav aria-label="Fil d'Ariane" className="mb-4">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link href="/">Accueil</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/commandes">Mes commandes</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {order.reference}
            </li>
          </ol>
        </nav>

        <div
          className="text-center mb-5 mx-auto"
          style={{ maxWidth: "640px" }}
        >
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 80,
              height: 80,
              background: "rgba(25, 135, 84, 0.12)",
            }}
          >
            <i
              className="bi bi-check-circle-fill text-success"
              style={{ fontSize: "2.5rem" }}
              aria-hidden="true"
            ></i>
          </div>
          <h1 className="h2 fw-bold mb-2">Merci pour votre commande !</h1>
          <p className="text-secondary mb-3">
            Votre commande a bien été enregistrée. Le vendeur va la confirmer
            sous peu et vous contacter au numéro indiqué.
          </p>
          <p className="mb-0">
            Référence&nbsp;:{" "}
            <strong className="text-uppercase">{order.reference}</strong>
          </p>
        </div>

        <div className="row g-4">
          {/* Récap principal */}
          <div className="col-lg-8">
            <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
              <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                <h2 className="h5 fw-bold mb-0">Articles commandés</h2>
                <span className="badge bg-warning text-dark align-self-start">
                  {statusLabel}
                </span>
              </div>

              {order.items.map((item, index) => (
                <div
                  key={`${item.productName}-${index}`}
                  className="d-flex justify-content-between gap-3 py-3 border-bottom"
                >
                  <div>
                    <div className="fw-semibold">{item.productName}</div>
                    <div className="text-secondary small">
                      Quantité&nbsp;: {item.quantity}
                      {item.sku ? ` · SKU ${item.sku}` : ""}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold">
                      {formatPrice(item.subtotal, order.currency)}
                    </div>
                    <div className="text-secondary small">
                      {formatPrice(item.unitPrice, order.currency)} / unité
                    </div>
                  </div>
                </div>
              ))}

              <div className="d-flex justify-content-between mt-3">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotalAmount, order.currency)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Livraison</span>
                <span>
                  {order.deliveryFee > 0
                    ? formatPrice(order.deliveryFee, order.currency)
                    : "Gratuit"}
                </span>
              </div>
              <div className="d-flex justify-content-between border-top pt-3 mt-3">
                <strong>Total</strong>
                <strong style={{ color: "var(--mf-orange)", fontSize: "1.25rem" }}>
                  {formatPrice(order.totalAmount, order.currency)}
                </strong>
              </div>
            </div>

            {order.notes && (
              <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
                <h2 className="h6 fw-bold mb-2">Note pour le vendeur</h2>
                <p className="mb-0 text-secondary">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Détails livraison / paiement */}
          <div className="col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-shop me-2" aria-hidden="true"></i>
                Vendeur
              </h2>
              <p className="mb-0">{sellerName}</p>
            </div>

            <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-truck me-2" aria-hidden="true"></i>
                {isPickup ? "Retrait en boutique" : "Livraison"}
              </h2>
              <p className="mb-2">
                <strong>{fulfillmentLabel}</strong>
              </p>
              {!isPickup && order.shippingAddress.city && (
                <p className="text-secondary small mb-0">
                  {order.shippingAddress.street}
                  <br />
                  {order.shippingAddress.city}
                  {order.shippingAddress.region
                    ? `, ${order.shippingAddress.region}`
                    : ""}
                  <br />
                  {order.shippingAddress.country}
                  {order.shippingAddress.postalCode
                    ? ` · ${order.shippingAddress.postalCode}`
                    : ""}
                </p>
              )}
            </div>

            <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-credit-card me-2" aria-hidden="true"></i>
                Paiement
              </h2>
              <p className="mb-0">{paymentLabel}</p>
            </div>

            <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-telephone me-2" aria-hidden="true"></i>
                Contact
              </h2>
              <p className="mb-0">{order.customerPhone}</p>
            </div>

            <div className="d-grid gap-2">
              <Link href="/commandes" className="btn btn-warning fw-bold">
                Voir mes commandes
              </Link>
              <Link href="/boutique" className="btn btn-outline-dark">
                Retour à la boutique
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
