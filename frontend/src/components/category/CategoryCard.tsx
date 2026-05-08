import Link from "next/link";
import styles from "@/styles/catalog.module.css";
import type { CategoryItem } from "@/types/catalog";

type CategoryCardProps = {
  category: CategoryItem;
  variant?: "featured" | "row";
};

export default function CategoryCard({ category, variant = "row" }: CategoryCardProps) {
  const href = `/boutique?category=${category.slug}`;

  if (variant === "featured") {
    return (
      <Link href={href} className={styles.categoryFeatured}>
        <span className={styles.categoryFeaturedIcon}>
          <i className={category.icon} aria-hidden="true"></i>
        </span>
        <h2 className={styles.categoryFeaturedTitle}>{category.name}</h2>
        <p className={styles.categoryCardText}>{category.description}</p>
        <div className={styles.categoryFeaturedFooter}>
          <span className={styles.categoryMeta}>
            <i className="bi bi-box" aria-hidden="true"></i>
            {category.productCount} produits
          </span>
          <i className={`bi bi-arrow-right ${styles.categoryArrow}`} aria-hidden="true"></i>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className={styles.categoryRow}>
      <div className={styles.categoryRowStart}>
        <span className={styles.categoryRowIcon}>
          <i className={category.icon} aria-hidden="true"></i>
        </span>
        <div>
          <h3 className={styles.categoryRowTitle}>{category.name}</h3>
          <p className={styles.categoryCardText}>{category.shortDescription}</p>
        </div>
      </div>
      <span className={styles.categoryCount}>{category.productCount}</span>
    </Link>
  );
}
