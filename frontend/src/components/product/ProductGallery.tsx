"use client";

import { useState } from "react";
import ProductImage from "@/components/product/ProductImage";
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
          <ProductImage
            key={activeImage.url}
            src={activeImage.url}
            alt={activeImage.altText || productName}
            className={styles.mainProductImage}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            fill
            sizes="(max-width: 575px) calc(100vw - 60px), (max-width: 991px) 660px, 600px"
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
              <ProductImage
                src={image.thumbUrl || image.url}
                alt=""
                className={styles.thumbImage}
                loading="lazy"
                fill
                sizes="(max-width: 575px) 30vw, 200px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
