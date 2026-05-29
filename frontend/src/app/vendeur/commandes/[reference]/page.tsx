/**
 * Route: app/vendeur/commandes/[reference]/page
 *
 * Rôle du fichier :
 *   Détail d'une commande côté vendeur + actions de changement de statut.
 *   Server Component protégé.
 *
 * Sécurité :
 *   - non connecté         -> redirect("/mon-compte")
 *   - pas vendeur approved -> redirect("/vendeur")
 *   - commande introuvable / non visible (backend 404) -> notFound().
 *     `getOrderByReference` renvoie null si l'utilisateur n'est pas
 *     acteur autorisé (customer-owner / seller-owner / admin) : on ne
 *     révèle donc pas l'existence d'une commande d'un autre vendeur.
 *   - `dynamic = "force-dynamic"`.
 *
 * Note pour GitHub Copilot :
 *   - Le changement de statut est délégué au Client Component
 *     OrderStatusActions (qui passe par le Route Handler BFF).
 *   - Les libellés paiement/livraison sont locaux (codes -> FR).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderStatusActions from "@/components/seller/OrderStatusActions";
import { getCurrentUser } from "@/lib/auth";
import { getOrderByReference } from "@/lib/orders";
import {
  buildOrderTimeline,
  orderStatusClass,
  orderStatusLabel,
} from "@/lib/orderStatus";
import { getMySellerProfile } from "@/lib/seller";
import { formatPrice } from "@/utils/formatPrice";

export const metadata: Metadata = {
  title: "Détail commande vendeur",
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ reference: string }>;
};

const PAYMENT_LABEL: Record<string, string> = {
  cash_on_delivery: "Paiement à la livraison",
  pay_on_pickup: "Paiement au retrait",
};

const FULFILLMENT_LABEL: Record<string, string> = {
  home_delivery: "Livraison à domicile",
  seller_pickup: "Retrait en boutique",
};

export default async function VendeurCommandeDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/mon-compte");

  const profile = await getMySellerProfile();
  if (!profile || profile.status !== "approved") redirect("/vendeur");

  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order) notFound();

  const isPickup = order.fulfillmentMethod === "seller_pickup";
  const timeline = buildOrderTimeline(order.status);
  const dateValue = order.placedAt || order.createdAt;
  const paymentLabel = PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod;
  const fulfillmentLabel =
    FULFILLMENT_LABEL[order.fulfillmentMethod] ?? order.fulfillmentMethod;

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/vendeur">Espace vendeur</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/vendeur/commandes">Commandes</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {order.reference}
          </li>
        </ol>
      </nav>

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Commande {order.reference}</h1>
          <p className="text-secondary mb-0">
            {dateValue
              ? new Date(dateValue).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        <span
          className={`badge rounded-pill bg-${orderStatusClass(order.status)} align-self-center`}
          style={{ fontSize: "0.85rem" }}
        >
          {orderStatusLabel(order.status)}
        </span>
      </div>

      <div className="row g-4">
        {/* Articles + totaux + timeline */}
        <div className="col-lg-8">
          <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
            <h2 className="h5 fw-bold mb-3">Articles</h2>
            {order.items.map((item, index) => (
              <div
                key={`${order.reference}-${index}`}
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
              <span>Frais de livraison</span>
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

          {/* Timeline */}
          <div className="bg-white rounded-3 shadow-sm p-4">
            <h2 className="h6 fw-bold mb-3">Suivi</h2>
            {timeline.map((step, index) => (
              <div key={index} className="d-flex gap-3 mb-3">
                <i
                  className={`${step.icon}`}
                  style={{
                    color:
                      step.state === "done"
                        ? "var(--mf-green, #198754)"
                        : step.state === "active"
                          ? "var(--mf-orange)"
                          : "#adb5bd",
                  }}
                  aria-hidden="true"
                ></i>
                <div>
                  <div
                    className={
                      step.state === "pending" ? "text-secondary" : "fw-semibold"
                    }
                  >
                    {step.label}
                  </div>
                  <div className="text-secondary small">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions + infos client/livraison/paiement */}
        <div className="col-lg-4">
          <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
            <h2 className="h6 fw-bold mb-3">
              <i className="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
              Changer le statut
            </h2>
            <OrderStatusActions
              reference={order.reference}
              status={order.status}
            />
          </div>

          <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
            <h2 className="h6 fw-bold mb-3">
              <i className="bi bi-person me-2" aria-hidden="true"></i>
              Client
            </h2>
            <p className="mb-0">
              <i className="bi bi-telephone me-1" aria-hidden="true"></i>
              {order.customerPhone || "—"}
            </p>
          </div>

          <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
            <h2 className="h6 fw-bold mb-3">
              <i className="bi bi-truck me-2" aria-hidden="true"></i>
              {isPickup ? "Retrait" : "Livraison"}
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

          <div className="bg-white rounded-3 shadow-sm p-4">
            <h2 className="h6 fw-bold mb-3">
              <i className="bi bi-credit-card me-2" aria-hidden="true"></i>
              Paiement
            </h2>
            <p className="mb-0">{paymentLabel}</p>
          </div>

          {order.notes && (
            <div className="bg-white rounded-3 shadow-sm p-4 mt-4">
              <h2 className="h6 fw-bold mb-2">Note du client</h2>
              <p className="text-secondary mb-0">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
