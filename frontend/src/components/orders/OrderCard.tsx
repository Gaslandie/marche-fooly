import Link from "next/link";
import type { Order } from "@/types/order";
import { formatPrice } from "@/utils/formatPrice";
import { statusLabel, statusClass } from "@/data/orders";
import styles from "@/styles/orders.module.css";

type Props = {
  order: Order;
};

export default function OrderCard({ order }: Props) {
  const badgeClass = `badge bg-${statusClass[order.status]} rounded-pill`;

  return (
    <article className={styles.orderCard}>
      {/* Header */}
      <div className={styles.orderHeader}>
        <div>
          <span className={styles.orderId}>Commande #{order.id}</span>
        </div>
        <div className={styles.orderMeta}>
          <i className="bi bi-calendar3" aria-hidden="true"></i>
          {new Date(order.date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className={styles.orderMeta}>
          <i className="bi bi-geo-alt" aria-hidden="true"></i>
          {order.location}
        </div>
        <span className={`ms-auto ${badgeClass}`}>
          {statusLabel[order.status]}
        </span>
      </div>

      {/* Items */}
      <div className={styles.orderBody}>
        {order.items.map((item, i) => (
          <div key={i} className={styles.orderItem}>
            <div className={styles.orderItemIcon}>
              <i className={item.icon} aria-hidden="true"></i>
            </div>
            <div>
              <p className={styles.orderItemName}>{item.name}</p>
              <p className={styles.orderItemMeta}>
                {item.vendor} · Qté {item.quantity}
              </p>
            </div>
            <div className={styles.orderItemPrice}>
              {formatPrice(item.price * item.quantity, item.currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        {order.timeline.map((step, i) => {
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
            {formatPrice(order.total, order.currency)}
          </span>
        </div>
        <div className="d-flex gap-2">
          <Link href="/boutique" className="btn btn-outline-dark btn-sm">
            <i className="bi bi-arrow-repeat me-1" aria-hidden="true"></i>
            Recommander
          </Link>
          <Link href="/boutique" className="btn btn-warning fw-bold btn-sm">
            <i className="bi bi-headset me-1" aria-hidden="true"></i>
            Assistance
          </Link>
        </div>
      </div>
    </article>
  );
}
