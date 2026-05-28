/**
 * Composant: OrderCard
 *
 * Rôle du fichier :
 *   Carte d'une commande dans l'historique client. Consomme une
 *   `PublicOrder` (forme API) et affiche : référence, date, vendeur
 *   (unique — mono-vendeur), badge statut, articles, timeline dérivée du
 *   statut, total, et un lien « Voir le détail » vers /commande/[reference].
 *
 * Où il est utilisé :
 *   - components/orders/OrdersHistory.tsx (liste filtrée côté client).
 *
 * Prérequis / sécurité :
 *   - N'importe QUE des helpers PURS (`lib/orderStatus`) et le TYPE
 *     `PublicOrder` (import type, effacé à la compilation) : aucun code
 *     serveur (`lib/orders`/`next/headers`) ne fuit dans le bundle client.
 *   - Aucune action de changement de statut ici (lecture seule côté client).
 *
 * Note pour GitHub Copilot :
 *   - L'API ne fournit pas d'icône par article -> icône générique.
 *   - Le vendeur est au niveau commande (mono-vendeur), pas par article.
 *   - La timeline vient de buildOrderTimeline(status) (déterministe).
 */

import Link from "next/link";
import type { PublicOrder } from "@/lib/orders";
import {
  buildOrderTimeline,
  orderStatusClass,
  orderStatusLabel,
} from "@/lib/orderStatus";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/orders.module.css";

type Props = {
  order: PublicOrder;
};

function sellerName(seller: PublicOrder["seller"]): string {
  if (seller && typeof seller === "object") return seller.storeName;
  return "Vendeur Marché Fooly";
}

export default function OrderCard({ order }: Props) {
  const badgeClass = `badge bg-${orderStatusClass(order.status)} rounded-pill`;
  const timeline = buildOrderTimeline(order.status);
  const dateValue = order.placedAt || order.createdAt;
  const isPickup = order.fulfillmentMethod === "seller_pickup";
  const location = isPickup
    ? "Retrait en boutique"
    : order.shippingAddress?.city || "Livraison";

  return (
    <article className={styles.orderCard}>
      {/* Header */}
      <div className={styles.orderHeader}>
        <div>
          <span className={styles.orderId}>Commande #{order.reference}</span>
        </div>
        <div className={styles.orderMeta}>
          <i className="bi bi-calendar3" aria-hidden="true"></i>
          {dateValue
            ? new Date(dateValue).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "—"}
        </div>
        <div className={styles.orderMeta}>
          <i className="bi bi-shop" aria-hidden="true"></i>
          {sellerName(order.seller)}
        </div>
        <div className={styles.orderMeta}>
          <i className="bi bi-geo-alt" aria-hidden="true"></i>
          {location}
        </div>
        <span className={`ms-auto ${badgeClass}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {/* Items */}
      <div className={styles.orderBody}>
        {order.items.map((item, i) => (
          <div key={`${order.reference}-${i}`} className={styles.orderItem}>
            <div className={styles.orderItemIcon}>
              <i className="bi bi-box-seam" aria-hidden="true"></i>
            </div>
            <div>
              <p className={styles.orderItemName}>{item.productName}</p>
              <p className={styles.orderItemMeta}>
                Qté {item.quantity} ·{" "}
                {formatPrice(item.unitPrice, order.currency)} / unité
              </p>
            </div>
            <div className={styles.orderItemPrice}>
              {formatPrice(item.subtotal, order.currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline dérivée du statut */}
      <div className={styles.timeline}>
        {timeline.map((step, i) => {
          const stepCls =
            step.state === "done"
              ? styles.timelineStepDone
              : step.state === "active"
                ? styles.timelineStepActive
                : "";
          return (
            <div key={i} className={`${styles.timelineStep} ${stepCls}`}>
              <div className={styles.timelineIcon}>
                <i className={step.icon} aria-hidden="true"></i>
              </div>
              <div>
                <p className={styles.timelineLabel}>{step.label}</p>
                <p className={styles.timelineDesc}>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={styles.orderFooter}>
        <div className={styles.orderTotal}>
          Total :{" "}
          <span className={styles.orderTotalValue}>
            {formatPrice(order.totalAmount, order.currency)}
          </span>
        </div>
        <div className="d-flex gap-2">
          <Link
            href={`/commande/${order.reference}`}
            className="btn btn-warning fw-bold btn-sm"
          >
            <i className="bi bi-eye me-1" aria-hidden="true"></i>
            Voir le détail
          </Link>
        </div>
      </div>
    </article>
  );
}
