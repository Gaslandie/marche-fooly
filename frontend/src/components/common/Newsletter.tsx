"use client";

import { FormEvent } from "react";

export default function Newsletter() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <section className="mf-newsletter">
      <h5 className="mb-2">Newsletter</h5>
      <p className="text-muted mb-3">Recevez les nouveautés et offres locales de Marché Fooly.</p>
      <form className="mf-newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          className="form-control"
          placeholder="Votre email"
          aria-label="Votre email"
        />
        <button type="submit" className="btn btn-warning">
          S&apos;abonner
        </button>
      </form>
    </section>
  );
}
