"use client";

import { FormEvent } from "react";

export default function SearchBar() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form className="mf-searchbar" role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        className="form-control"
        placeholder="Rechercher un produit, une catégorie..."
        aria-label="Rechercher"
      />
      <button type="submit" className="btn btn-warning">
        Rechercher
      </button>
    </form>
  );
}
