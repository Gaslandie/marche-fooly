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
 *   - `coverImageUrl` = URL texte (pas d'upload de fichier au MVP).
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
  sku: string;
  coverImageUrl: string;
  deliveryFee: string;
  isFreeDelivery: boolean;
  status: "active" | "out_of_stock";
  category: string;
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
  sku: "",
  coverImageUrl: "",
  deliveryFee: "0",
  isFreeDelivery: false,
  status: "active",
  category: "",
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
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof SellerProductFormValues>(
    key: K,
    value: SellerProductFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
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
    return null;
  }

  // Corps strictement whitelisté (le Route Handler re-sanitise aussi).
  function buildBody() {
    return {
      name: values.name.trim(),
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      stockQuantity: Number(values.stockQuantity),
      sku: values.sku.trim(),
      coverImageUrl: values.coverImageUrl.trim(),
      deliveryFee: Number(values.deliveryFee || 0),
      isFreeDelivery: values.isFreeDelivery,
      status: values.status,
      category: values.category,
    };
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
          <label className="form-label fw-semibold" htmlFor="p-sku">
            SKU (optionnel)
          </label>
          <input
            id="p-sku"
            type="text"
            className="form-control"
            value={values.sku}
            onChange={(e) => update("sku", e.target.value)}
            maxLength={64}
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
          <label className="form-label fw-semibold" htmlFor="p-cover">
            Image (URL)
          </label>
          <input
            id="p-cover"
            type="url"
            className="form-control"
            placeholder="https://…"
            value={values.coverImageUrl}
            onChange={(e) => update("coverImageUrl", e.target.value)}
            disabled={submitting}
          />
          <div className="form-text">
            Collez l&apos;adresse d&apos;une image en ligne (l&apos;upload de
            fichier sera disponible plus tard).
          </div>
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
        <button type="submit" className="btn btn-warning fw-bold" disabled={submitting}>
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
