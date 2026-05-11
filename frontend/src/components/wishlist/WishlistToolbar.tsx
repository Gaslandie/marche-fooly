"use client";

import styles from "@/styles/wishlist.module.css";

type Props = {
  count: number;
};

export default function WishlistToolbar({ count }: Props) {
  return (
    <div className={styles.wishlistToolbar}>
      <div className="row align-items-center g-3">
        <div className="col-md-4">
          <strong>{count} produits favoris</strong>
          <span className="d-block text-secondary small">Produits sauvegardés récemment</span>
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            type="search"
            placeholder="Rechercher dans mes favoris..."
            aria-label="Rechercher dans les favoris"
            style={{ minHeight: "50px", borderRadius: "16px" }}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            aria-label="Trier les favoris"
            style={{ minHeight: "50px", borderRadius: "16px" }}
          >
            <option>Tri recommandé</option>
            <option>Prix croissant</option>
            <option>Prix décroissant</option>
            <option>Ajoutés récemment</option>
            <option>Disponibles en stock</option>
          </select>
        </div>
      </div>
    </div>
  );
}
