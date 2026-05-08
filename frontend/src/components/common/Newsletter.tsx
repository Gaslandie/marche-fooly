export default function Newsletter() {
  return (
    <section className="mf-newsletter">
      <h5 className="mb-2">Newsletter</h5>
      <p className="text-muted mb-3">Recevez les nouveautés et offres locales de Marché Fooly.</p>
      <form className="mf-newsletter-form" action="/contact" method="get">
        <input type="hidden" name="topic" value="newsletter" />
        <input
          type="email"
          name="email"
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
