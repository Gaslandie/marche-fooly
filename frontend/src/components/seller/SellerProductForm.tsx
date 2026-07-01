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
 *     `coverImage` avec la reference GridFS retournee par le backend.
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
  deliveryFee: "0",
  isFreeDelivery: false,
  status: "active",
  category: "",
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
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
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    initial?.coverImageUrl ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof SellerProductFormValues>(
    key: K,
    value: SellerProductFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      setError("Format image non supporté. Utilisez JPG, PNG, WebP ou AVIF.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setError("Image trop lourde. Taille maximum : 4 Mo.");
      event.currentTarget.value = "";
      return;
    }

    setError(null);
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
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
        setError(body?.message ?? "Upload image impossible.");
        return;
      }

      update("coverImage", {
        largeFileId: uploaded.largeFileId,
        thumbFileId: uploaded.thumbFileId,
        version: uploaded.version,
      });
      update("coverImageUrl", previewUrl);
      setImagePreviewUrl(previewUrl);
    } catch {
      setError("Service d'upload indisponible. Réessayez plus tard.");
    } finally {
      setUploadingImage(false);
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
    if (values.coverImage) {
      payload.coverImage = values.coverImage;
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
            Image du produit
          </label>
          <input
            id="p-cover-file"
            type="file"
            className="form-control mb-2"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleImageUpload}
            disabled={submitting || uploadingImage}
          />
          <div className="form-text mb-2">
            JPG, PNG, WebP ou AVIF. Taille maximum : 4 Mo.
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
          {imagePreviewUrl && (
            <div
              className="border rounded-3 mb-2"
              aria-label="Aperçu de l'image produit"
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                backgroundColor: "#f8f9fa",
                backgroundImage: `url(${JSON.stringify(imagePreviewUrl)})`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }}
            />
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
