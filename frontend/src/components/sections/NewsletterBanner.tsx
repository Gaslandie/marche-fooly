import styles from "@/styles/catalog.module.css";

export default function NewsletterBanner() {
  return (
    <div className={styles.newsletterBanner}>
      <div className="row align-items-center g-4">
        <div className="col-lg-6">
          <h2>Recevez les meilleures offres</h2>
          <p className={styles.newsletterText}>
            Promos, nouveautés et bons plans directement dans votre boîte email.
          </p>
        </div>
        <div className="col-lg-6">
          <form className={styles.newsletterForm} action="/contact" method="get">
            <input type="hidden" name="topic" value="newsletter" />
            <input
              className="form-control"
              type="email"
              name="email"
              placeholder="Votre adresse email"
              aria-label="Votre email"
              required
            />
            <button className="btn btn-dark btn-lg" type="submit">
              S&apos;inscrire
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
