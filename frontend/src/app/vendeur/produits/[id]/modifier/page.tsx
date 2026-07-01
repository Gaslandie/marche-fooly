/**
 * Route: app/vendeur/produits/[id]/modifier/page
 *
 * Rôle du fichier :
 *   Page d'édition d'un produit vendeur. Server Component protégé qui
 *   charge le produit (parmi ceux du vendeur), pré-remplit le formulaire
 *   et fournit les options de catégories.
 *
 * Sécurité / ownership :
 *   - non connecté        -> redirect("/mon-compte")
 *   - pas vendeur approved -> redirect("/vendeur")
 *   - produit introuvable dans la liste du vendeur -> notFound() (404).
 *     C'est un premier filtre d'ownership CÔTÉ FRONTEND (le produit doit
 *     appartenir au vendeur connecté pour apparaître dans getSellerProducts).
 *     L'ownership DÉFINITIF reste vérifié par le backend au PATCH.
 *   - `dynamic = "force-dynamic"`.
 *
 * Note pour GitHub Copilot :
 *   - Pas d'endpoint GET /api/products/:id : on retrouve le produit dans
 *     la liste du vendeur (active/out_of_stock). Les draft/archived ne
 *     sont donc pas éditables au MVP (limite assumée).
 *   - category peut être un objet peuplé {id,...} ou une string ; on en
 *     extrait l'id pour le <select>.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SellerProductForm, {
  type SellerProductFormValues,
} from "@/components/seller/SellerProductForm";
import { getCategoryOptions } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getMySellerProfile, getSellerProducts } from "@/lib/seller";
import type { ApiProduct } from "@/types/api";

export const metadata: Metadata = {
  title: "Modifier un produit",
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function categoryId(category: ApiProduct["category"]): string {
  if (category && typeof category === "object") return category.id;
  return "";
}

function toFormValues(product: ApiProduct): SellerProductFormValues {
  return {
    name: product.name,
    shortDescription: product.shortDescription ?? "",
    description: product.description,
    price: String(product.price ?? ""),
    stockQuantity: String(product.stockQuantity ?? ""),
    coverImageUrl: product.coverImageUrl ?? "",
    coverImage: null,
    deliveryFee: String(product.deliveryFee ?? 0),
    isFreeDelivery: !!product.isFreeDelivery,
    // Statut borné au MVP (un éventuel draft/archived retombe sur "active").
    status: product.status === "out_of_stock" ? "out_of_stock" : "active",
    category: categoryId(product.category),
  };
}

export default async function ModifierProduitPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/mon-compte");

  const profile = await getMySellerProfile();
  if (!profile || profile.status !== "approved") redirect("/vendeur");

  const { id } = await params;
  const products = await getSellerProducts(profile.slug);
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  const categories = await getCategoryOptions();

  return (
    <section className="container py-5">
      <nav aria-label="Fil d'Ariane" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/vendeur">Espace vendeur</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Modifier
          </li>
        </ol>
      </nav>

      <h1 className="h3 fw-bold mb-4">Modifier « {product.name} »</h1>

      <div className="row">
        <div className="col-lg-8">
          <SellerProductForm
            mode="edit"
            productId={product.id}
            categories={categories}
            initial={toFormValues(product)}
          />
        </div>
      </div>
    </section>
  );
}
