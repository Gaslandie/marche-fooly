export default function SearchBar() {
  return (
    <form className="mf-searchbar" role="search" action="/boutique" method="get">
      <input
        type="search"
        name="q"
        className="form-control"
        placeholder="Rechercher téléphone, maison, mode..."
        aria-label="Rechercher un produit"
      />
      <button type="submit" className="btn btn-warning">
        Rechercher
      </button>
    </form>
  );
}
