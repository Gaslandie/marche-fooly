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
            {/* productCount n'est pas fourni par l'API : on affiche un libellé
                neutre plutôt qu'un faux chiffre (décision Jour 21). */}
            {category.productCount > 0
              ? `${category.productCount} produits`
              : "Voir les produits"}
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
      {/* productCount absent de l'API -> on remplace le badge chiffré par une
          flèche neutre plutôt que d'afficher « 0 » (décision Jour 21). */}
      <span className={styles.categoryCount}>
        {category.productCount > 0 ? (
          category.productCount
        ) : (
          <i className="bi bi-chevron-right" aria-hidden="true"></i>
        )}
      </span>
    </Link>
  );
}
