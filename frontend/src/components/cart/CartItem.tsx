import Link from "next/link";
import QuantitySelector from "@/components/product/QuantitySelector";
import { formatPrice } from "@/utils/formatPrice";
import styles from "@/styles/cart.module.css";

export type CartItemData = {
  slug: string;
  name: string;
  icon: string;
  vendor: string;
  meta: string;
  price: number;
  currency: string;
  quantity: number;
};

export default function CartItem({ slug, name, icon, vendor, meta, price, currency, quantity }: CartItemData) {
  return (
    <div className={styles.cartProduct}>
      <div className={styles.cartProductImg}>
        <i className={icon} aria-hidden="true"></i>
      </div>

      <div>
        <h2 className={styles.cartProductTitle}>
          <Link href={`/produit/${slug}`}>{name}</Link>
        </h2>
        <div className={styles.cartProductMeta}>
          Vendeur : {vendor} · {meta}
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
          <span className="badge rounded-pill bg-success">En stock</span>
          <Link href="/panier" className={styles.removeLink}>
            <i className="bi bi-trash me-1" aria-hidden="true"></i>Retirer
          </Link>
        </div>
      </div>

      <div className={styles.cartProductActions}>
        <div className="mb-2">
          <QuantitySelector initial={quantity} />
        </div>
        <div className={styles.cartProductPrice}>
          {formatPrice(price * quantity, currency)}
        </div>
      </div>
    </div>
  );
}
