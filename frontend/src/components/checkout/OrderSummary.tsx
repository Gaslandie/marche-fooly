import type { CartItemData } from "@/components/cart/CartItem";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/checkout.module.css";

type Props = {
  items: CartItemData[];
};

export default function OrderSummary({ items }: Props) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = "GNF";

  return (
    <aside className={styles.summaryCard}>
      <h2 className="h5 fw-bold mb-3">Résumé de commande</h2>

      <div className="mb-3">
        {items.map((item) => (
          <div key={item.slug} className={styles.summaryItem}>
            <div className={styles.summaryItemIcon}>
              <i className={item.icon} aria-hidden="true"></i>
            </div>
            <div className="flex-grow-1">
              <div className={styles.summaryItemName}>{item.name}</div>
              <div className="text-secondary" style={{ fontSize: "0.78rem" }}>
                {item.vendor} · Qté {item.quantity}
              </div>
            </div>
            <div className={styles.summaryItemPrice}>
              {formatPrice(item.price * item.quantity, item.currency)}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summaryLine}>
        <span>Sous-total</span>
        <strong>{formatPrice(subtotal, currency)}</strong>
      </div>
      <div className={styles.summaryLine}>
        <span>Livraison</span>
        <strong>À confirmer</strong>
      </div>
      <div className={styles.summaryLine}>
        <span>Remise</span>
        <strong>{formatPrice(0, currency)}</strong>
      </div>

      <div className={styles.summaryTotal}>
        <span className={styles.summaryTotalLabel}>Total</span>
        <strong className={styles.summaryTotalValue}>
          {formatPrice(subtotal, currency)}
        </strong>
      </div>

      <div className="mt-4 pt-3 border-top">
        <div className={styles.securityRow}>
          <i className="bi bi-shield-check text-success" aria-hidden="true"></i>
          <span className="small text-secondary fw-semibold">Vendeurs locaux vérifiés</span>
        </div>
        <div className={styles.securityRow}>
          <i className="bi bi-lock text-primary" aria-hidden="true"></i>
          <span className="small text-secondary fw-semibold">Informations protégées</span>
        </div>
        <div className={styles.securityRow}>
          <i className="bi bi-geo-alt" style={{ color: "var(--mf-orange)" }} aria-hidden="true"></i>
          <span className="small text-secondary fw-semibold">Livraison locale à Sangarédi</span>
        </div>
      </div>
    </aside>
  );
}
