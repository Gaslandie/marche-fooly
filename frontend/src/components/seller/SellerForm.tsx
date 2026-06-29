"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/seller.module.css";

const CATEGORIES = [
  "Téléphones & Accessoires",
  "Maison / Cuisine",
  "Électroménagers",
  "Vêtements Femme",
  "Vêtements Homme",
  "Alimentation",
  "Automobile",
  "Sacs / Bijoux",
];

const PRODUCT_COUNTS = [
  "Moins de 10 produits",
  "10 à 50 produits",
  "50 à 100 produits",
  "Plus de 100 produits",
];

export default function SellerForm() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);

    const form = new FormData(e.currentTarget);
    const sellerName = String(form.get("sellerName") || "").trim();
    const sellerPhone = String(form.get("sellerPhone") || "").trim();
    const storeName = String(form.get("storeName") || "").trim();
    const shopCategory = String(form.get("shopCategory") || "").trim();
    const sellerLocation = String(form.get("sellerLocation") || "").trim();
    const productCount = String(form.get("productCount") || "").trim();
    const sellerMessage = String(form.get("sellerMessage") || "").trim();

    const description = [
      sellerName ? `Responsable : ${sellerName}` : "",
      shopCategory ? `Catégorie principale : ${shopCategory}` : "",
      productCount ? `Nombre de produits : ${productCount}` : "",
      sellerMessage,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/sellers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          description,
          contactDetails: { phone: sellerPhone },
          address: {
            city: sellerLocation,
            country: "Guinée",
          },
        }),
      });

      const body = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (res.status === 401) {
        router.push("/mon-compte");
        return;
      }

      if (!res.ok) {
        setError(body?.message ?? "Création de boutique impossible.");
        return;
      }

      setSent(true);
      router.refresh();
    } catch {
      setError("Service vendeur indisponible. Réessayez plus tard.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className={styles.formCard} style={{ textAlign: "center", padding: "3rem" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--mf-green)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 1.25rem",
            fontSize: "2rem",
            color: "#ffffff",
          }}
        >
          <i className="bi bi-shop-window" aria-hidden="true"></i>
        </div>
        <h2 className="h4 fw-bold mb-2">Demande reçue !</h2>
        <p className="text-secondary mb-4">
          L&apos;équipe Marché Fooly vous contactera pour finaliser votre boutique.
        </p>
        <button type="button" className="btn btn-outline-dark" onClick={() => setSent(false)}>
          Soumettre une autre demande
        </button>
      </div>
    );
  }

  return (
    <form id="formulaire-vendeur" className={styles.formCard} onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="sellerName">
            Nom complet
          </label>
          <input
            id="sellerName"
            name="sellerName"
            className={styles.inputField}
            type="text"
            placeholder="Ex : Mamadou Diallo"
            required
          />
        </div>

        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="sellerPhone">
            Téléphone
          </label>
          <input
            id="sellerPhone"
            name="sellerPhone"
            className={styles.inputField}
            type="tel"
            placeholder="+224 6XX XX XX XX"
            required
          />
        </div>

        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="shopName">
            Nom de la boutique
          </label>
          <input
            id="shopName"
            name="storeName"
            className={styles.inputField}
            type="text"
            placeholder="Ex : Boutique Diallo"
            required
          />
        </div>

        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="shopCategory">
            Catégorie principale
          </label>
          <select
            id="shopCategory"
            name="shopCategory"
            className={styles.inputField}
            defaultValue=""
            required
            style={{ appearance: "auto" }}
          >
            <option value="" disabled>
              Sélectionner une catégorie
            </option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="sellerLocation">
            Localisation
          </label>
          <input
            id="sellerLocation"
            name="sellerLocation"
            className={styles.inputField}
            type="text"
            placeholder="Ex : Sangarédi centre"
          />
        </div>

        <div className="col-md-6">
          <label className={styles.inputLabel} htmlFor="productCount">
            Nombre de produits
          </label>
          <select
            id="productCount"
            name="productCount"
            className={styles.inputField}
            defaultValue={PRODUCT_COUNTS[0]}
            style={{ appearance: "auto" }}
          >
            {PRODUCT_COUNTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="col-12">
          <label className={styles.inputLabel} htmlFor="sellerMessage">
            Message
          </label>
          <textarea
            id="sellerMessage"
            name="sellerMessage"
            className={styles.inputField}
            placeholder="Présentez rapidement vos produits ou votre boutique..."
            rows={4}
          />
        </div>

        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="sellerAgree"
              required
            />
            <label className="form-check-label text-secondary small" htmlFor="sellerAgree">
              J&apos;accepte d&apos;être contacté par l&apos;équipe Marché Fooly pour finaliser ma demande.
            </label>
          </div>
        </div>

        <div className="col-12">
          {error && (
            <div className="alert alert-warning mb-3" role="alert">
              {error}
            </div>
          )}
          <button
            className="btn btn-warning fw-bold w-100"
            type="submit"
            disabled={sending}
          >
            {sending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Envoi en cours…
              </>
            ) : (
              <>
                <i className="bi bi-shop me-1" aria-hidden="true"></i>
                Envoyer ma demande vendeur
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
