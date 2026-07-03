"use client";

import { useState } from "react";
import type { ProductImageItem } from "@/types/catalog";
import styles from "@/styles/product.module.css";

type Props = {
  images: ProductImageItem[];
  productName: string;
  fallbackIcon: string;
  badge?: string;
};

export default function ProductGallery({
  images,
  productName,
  fallbackIcon,
  badge,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0] ?? null;

  return (
    <div className={styles.galleryPanel}>
      <div className={`${styles.mainImage} mb-3`}>
        {badge && <span className={styles.galleryBadge}>{badge}</span>}
        {activeImage ? (
          <img
            src={activeImage.url}
            alt={activeImage.altText || productName}
            className={styles.mainProductImage}
            loading="eager"
          />
        ) : (
          <i className={`${fallbackIcon} ${styles.mainImageIcon}`} aria-hidden="true"></i>
        )}
      </div>

      {images.length > 1 && (
        <div className={styles.thumbnailGrid} aria-label="Photos du produit">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              className={`${styles.thumbItem} ${index === activeIndex ? styles.thumbItemActive : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Voir la photo ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <img
                src={image.thumbUrl || image.url}
                alt=""
                className={styles.thumbImage}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
