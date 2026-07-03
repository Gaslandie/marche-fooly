/**
 * Composant: SellerProductForm (Client Component)
 *
 * Rôle du fichier :
 *   Formulaire réutilisable de création ET d'édition d'un produit vendeur.
 *   Soumet aux Route Handlers internes (BFF) :
 *     - création : POST  /api/seller/products
 *     - édition  : PATCH /api/seller/products/[id]
 *   Après succès : redirection vers /vendeur.
 *
 * Où il est utilisé :
 *   - app/vendeur/produits/nouveau/page.tsx (mode "create")
 *   - app/vendeur/produits/[id]/modifier/page.tsx (mode "edit")
 *
 * Règles de sécurité / métier (IMPORTANT) :
 *   - N'envoie QUE des champs whitelistés. Ne transmet JAMAIS seller,
 *     slug, isFeatured, rating, id/_id, timestamps, version (le Route
 *     Handler re-sanitise de toute façon, défense en profondeur).
 *   - `currency` n'est pas envoyée (forcée à GNF côté serveur).
 *   - `status` limité au MVP : "active" / "out_of_stock".
 *   - L'upload image passe par /api/uploads/product-image et renseigne
 *     `images` avec les references GridFS retournees par le backend.
 *   - L'ownership final est garanti par le backend (PATCH sur un produit
 *     d'un autre vendeur -> 403/404 relayé en message inline).
 *
 * Note pour GitHub Copilot :
 *   - Les champs numériques sont stockés en string (inputs) puis convertis
 *     en nombres à la soumission.
 *   - Aucun JWT manipulé : le cookie httpOnly est lu côté serveur par le
 *     Route Handler.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CategoryOption } from "@/lib/api";

export type SellerProductFormValues = {
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  stockQuantity: string;
  coverImageUrl: string;
  coverImage: ProductCoverImageInput | null;
  images: ProductImageInput[];
  deliveryFee: string;
  isFreeDelivery: boolean;
  status: "active" | "out_of_stock";
  category: string;
};

export type ProductCoverImageInput = {
  largeFileId: string;
  thumbFileId: string;
  version: string;
};

export type ProductImageInput = ProductCoverImageInput & {
  url: string;
  thumbUrl: string;
  altText?: string;
};

type Props = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  productId?: string;
  initial?: SellerProductFormValues;
};

const EMPTY_VALUES: SellerProductFormValues = {
  name: "",
  shortDescription: "",
  description: "",
  price: "",
  stockQuantity: "",
  coverImageUrl: "",
  coverImage: null,
  images: [],
  deliveryFee: "0",
  isFreeDelivery: false,
  status: "active",
  category: "",
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_PRODUCT_IMAGES = 3;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type UploadImageResponse = {
  success?: boolean;
  message?: string;
  image?: {
    url?: string;
    largeUrl?: string;
    largeFileId?: string;
    thumbFileId?: string;
    version?: string;
    thumbUrl?: string;
  } | null;
};

export default function SellerProductForm({
  mode,
  categories,
  productId,
  initial,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState<SellerProductFormValues>(
    initial ?? EMPTY_VALUES,
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof SellerProductFormValues>(
    key: K,
    value: SellerProductFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function applyImages(nextImages: ProductImageInput[]) {
    const limited = nextImages.slice(0, MAX_PRODUCT_IMAGES);
    const primary = limited[0] ?? null;
    setValues((prev) => ({
      ...prev,
      images: limited,
      coverImage: primary
        ? {
            largeFileId: primary.largeFileId,
            thumbFileId: primary.thumbFileId,
            version: primary.version,
          }
        : null,
      coverImageUrl: primary?.url ?? "",
    }));
  }

  function removeImage(indexToRemove: number) {
    applyImages(values.images.filter((_, index) => index !== indexToRemove));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = MAX_PRODUCT_IMAGES - values.images.length;
    if (remainingSlots <= 0 || files.length > remainingSlots) {
      setError("Maximum 3 photos par produit.");
      event.currentTarget.value = "";
      return;
    }

    setError(null);
    setUploadingImage(true);

    try {
      const uploadedImages: ProductImageInput[] = [];
      for (const file of files) {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
          throw new Error("Format image non supporté. Utilisez JPG, PNG, WebP ou AVIF.");
        }

        if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
          throw new Error("Image trop lourde. Taille maximum : 4 Mo.");
        }

        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/uploads/product-image", {
          method: "POST",
          body: formData,
        });
        const body = (await res.json().catch(() => null)) as
          | UploadImageResponse
          | null;

        const uploaded = body?.image;
        const previewUrl = uploaded?.largeUrl || uploaded?.url || "";
        if (
          !res.ok ||
          !body?.success ||
          !previewUrl ||
          !uploaded?.largeFileId ||
          !uploaded.thumbFileId ||
          !uploaded.version
        ) {
          throw new Error(body?.message ?? "Upload image impossible.");
        }

        uploadedImages.push({
          largeFileId: uploaded.largeFileId,
          thumbFileId: uploaded.thumbFileId,
          version: uploaded.version,
          url: previewUrl,
          thumbUrl: uploaded.thumbUrl || previewUrl,
          altText: values.name.trim(),
        });
      }

      applyImages([...values.images, ...uploadedImages]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Service d'upload indisponible. Réessayez plus tard.",
      );
    } finally {
      setUploadingImage(false);
      event.currentTarget.value = "";
    }
  }

  function validate(): string | null {
    if (values.name.trim().length < 2) {
      return "Le nom doit contenir au moins 2 caractères.";
    }
    if (values.description.trim().length < 10) {
      return "La description doit contenir au moins 10 caractères.";
    }
    if (!values.category) {
      return "Veuillez choisir une catégorie.";
    }
    if (values.price === "" || Number(values.price) < 0) {
      return "Le prix doit être un nombre positif.";
    }
    if (values.stockQuantity === "" || Number(values.stockQuantity) < 0) {
      return "Le stock doit être un nombre positif.";
    }
    if (uploadingImage) {
      return "Veuillez attendre la fin de l'upload image.";
    }
    return null;
  }

  // Corps strictement whitelisté (le Route Handler re-sanitise aussi).
  function buildBody() {
    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      stockQuantity: Number(values.stockQuantity),
      deliveryFee: Number(values.deliveryFee || 0),
      isFreeDelivery: values.isFreeDelivery,
      status: values.status,
      category: values.category,
    };
    payload.images = values.images.map((image, index) => ({
      largeFileId: image.largeFileId,
      thumbFileId: image.thumbFileId,
      version: image.version,
      altText: image.altText || values.name.trim(),
      sortOrder: index,
      isPrimary: index === 0,
    }));
    if (values.images[0]) {
      payload.coverImage = {
        largeFileId: values.images[0].largeFileId,
        thumbFileId: values.images[0].thumbFileId,
        version: values.images[0].version,
      };
    }
    return payload;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);

    const url =
      mode === "edit"
        ? `/api/seller/products/${productId}`
        : "/api/seller/products";
    const method = mode === "edit" ? "PATCH" : "POST";

    let httpOk = false;
    let body: { success?: boolean; message?: string } | null = null;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      httpOk = res.ok;
      body = await res.json();
    } catch {
      setSubmitting(false);
      setError("Service indisponible. Vérifiez votre connexion et réessayez.");
      return;
    }

    if (!httpOk || !body?.success) {
      setSubmitting(false);
      setError(body?.message ?? "Échec de l'enregistrement du produit.");
      return;
    }

    router.push("/vendeur");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3 shadow-sm p-4">
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="p-name">
            Nom du produit
          </label>
          <input
            id="p-name"
            type="text"
            className="form-control"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            required
            minLength={2}
            maxLength={160}
            disabled={submitting}
          />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="p-short">
            Description courte (optionnel)
          </label>
          <input
            id="p-short"
            type="text"
            className="form-control"
            value={values.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
            maxLength={220}
            disabled={submitting}
          />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="p-desc">
            Description
          </label>
          <textarea
            id="p-desc"
            className="form-control"
            rows={4}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            required
            minLength={10}
            maxLength={4000}
            disabled={submitting}
          />
        </div>

        <div className="col-sm-6">
          <label className="form-label fw-semibold" htmlFor="p-category">
            Catégorie
          </label>
          <select
            id="p-category"
            className="form-select"
            value={values.category}
            onChange={(e) => update("category", e.target.value)}
            required
            disabled={submitting}
          >
            <option value="">— Choisir —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-sm-6">
          <label className="form-label fw-semibold" htmlFor="p-status">
            Statut
          </label>
          <select
            id="p-status"
            className="form-select"
            value={values.status}
            onChange={(e) =>
              update("status", e.target.value as SellerProductFormValues["status"])
            }
            disabled={submitting}
          >
            <option value="active">Actif (visible en boutique)</option>
            <option value="out_of_stock">En rupture</option>
          </select>
        </div>

        <div className="col-sm-6">
          <label className="form-label fw-semibold" htmlFor="p-price">
            Prix (GNF)
          </label>
          <input
            id="p-price"
            type="number"
            min={0}
            step={1}
            className="form-control"
            value={values.price}
            onChange={(e) => update("price", e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="col-sm-6">
          <label className="form-label fw-semibold" htmlFor="p-stock">
            Stock disponible
          </label>
          <input
            id="p-stock"
            type="number"
            min={0}
            step={1}
            className="form-control"
            value={values.stockQuantity}
            onChange={(e) => update("stockQuantity", e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="col-sm-6">
          <label className="form-label fw-semibold" htmlFor="p-delivery">
            Frais de livraison (GNF)
          </label>
          <input
            id="p-delivery"
            type="number"
            min={0}
            step={1}
            className="form-control"
            value={values.deliveryFee}
            onChange={(e) => update("deliveryFee", e.target.value)}
            disabled={submitting || values.isFreeDelivery}
          />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="p-cover-file">
            Photos du produit
          </label>
          <input
            id="p-cover-file"
            type="file"
            className="form-control mb-2"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleImageUpload}
            disabled={submitting || uploadingImage || values.images.length >= MAX_PRODUCT_IMAGES}
          />
          <div className="form-text mb-2">
            Jusqu&apos;à 3 photos. JPG, PNG, WebP ou AVIF. Taille maximum : 4 Mo par photo.
          </div>
          {uploadingImage && (
            <div className="alert alert-info py-2 px-3 small mb-2" role="status">
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Upload de l&apos;image en cours…
            </div>
          )}
          {values.images.length > 0 && (
            <div className="row g-2">
              {values.images.map((image, index) => (
                <div className="col-6 col-md-4" key={`${image.largeFileId}-${index}`}>
                  <div
                    className="border rounded-3 position-relative overflow-hidden bg-light"
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <img
                      src={image.thumbUrl || image.url}
                      alt={`Photo ${index + 1} du produit`}
                      className="w-100 h-100"
                      style={{ objectFit: "contain", background: "#ffffff" }}
                    />
                    {index === 0 && (
                      <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2">
                        Principale
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-dark position-absolute top-0 end-0 m-2"
                      onClick={() => removeImage(index)}
                      disabled={submitting || uploadingImage}
                      aria-label={`Retirer la photo ${index + 1}`}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-12">
          <div className="form-check">
            <input
              id="p-free"
              type="checkbox"
              className="form-check-input"
              checked={values.isFreeDelivery}
              onChange={(e) => update("isFreeDelivery", e.target.checked)}
              disabled={submitting}
            />
            <label className="form-check-label" htmlFor="p-free">
              Livraison gratuite
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 small mt-3 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
          {error}
        </div>
      )}

      <div className="d-flex gap-2 mt-4">
        <button
          type="submit"
          className="btn btn-warning fw-bold"
          disabled={submitting || uploadingImage}
        >
          {submitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Enregistrement…
            </>
          ) : mode === "edit" ? (
            <>
              <i className="bi bi-check2 me-1" aria-hidden="true"></i>
              Enregistrer les modifications
            </>
          ) : (
            <>
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              Créer le produit
            </>
          )}
        </button>
        <Link href="/vendeur" className="btn btn-outline-dark">
          Annuler
        </Link>
      </div>
    </form>
  );
}
