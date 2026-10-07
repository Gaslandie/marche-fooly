import ProductCard from "@/components/product/ProductCard";
import RemoveFavoriteButton from "@/components/wishlist/RemoveFavoriteButton";
import type { ProductItem } from "@/types/catalog";
import styles from "@/styles/wishlist.module.css";

type Props = {
  product: ProductItem;
};

export default function WishlistItem({ product }: Props) {
  return (
    <ProductCard
      product={product}
      headingLevel="h2"
      mediaAction={
        <RemoveFavoriteButton
          productId={product.productId}
          className={styles.wishlistRemove}
        />
      }
    />
  );
}
