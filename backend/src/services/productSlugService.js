/**
 * Service: productSlugService
 *
 * Role exact du fichier:
 *   Attribue le slug d'un produit a la creation. Plusieurs produits d'un
 *   meme vendeur peuvent porter le MEME nom d'affichage (ex. deux "Ciao
 *   Mayonnaise"): le slug, lui, doit rester unique par vendeur (index
 *   unique (seller, slug), URLs publiques). Quand le slug de base est deja
 *   pris, on suffixe avec le premier numero libre: -2, -3, ...
 *
 * Ou il est utilise:
 *   - backend/src/controllers/productController.js (create)
 *
 * Regles:
 *   - TOUS les statuts comptent, y compris "archived": l'index unique
 *     couvre toute la collection, un produit archive (invisible dans
 *     "Mes produits") reserve donc toujours son slug. Avant cette
 *     deduplication, c'etait la cause d'un blocage "fantome": impossible
 *     de reutiliser le nom d'un produit supprime.
 *   - Seuls les suffixes strictement numeriques sont consideres comme
 *     variantes du meme slug: "ciao-mayonnaise-800mg" n'entre pas en
 *     collision avec "ciao-mayonnaise".
 *   - Le slug n'est JAMAIS recalcule au PATCH (stabilite des URLs
 *     publiques deja partagees).
 */

const Product = require("../models/Product");
const { slugify } = require("../utils/slugify");
const { escapeRegex } = require("../validators/productValidators");

// Plafond de variantes d'un meme nom chez un vendeur. Aucun usage legitime
// n'approche ce chiffre; sans plafond, un vendeur (ou un script avec son
// token) pourrait creer des doublons en masse et rendre chaque nouvelle
// creation de plus en plus couteuse (la requete ci-dessous recharge toutes
// les variantes existantes).
const MAX_NAME_VARIANTS = 200;

/** Refus metier: trop de produits portent deja ce nom chez ce vendeur. */
class ProductSlugLimitError extends Error {
  constructor() {
    super(
      "Trop de produits portent deja ce nom dans votre boutique. " +
        "Precisez le nom (contenance, format, ...).",
    );
    this.name = "ProductSlugLimitError";
    this.status = 422;
  }
}

/**
 * Retourne le premier slug libre pour (sellerId, name): le slug de base
 * si personne ne l'occupe, sinon `base-2`, `base-3`, ...
 * Un nom sans caractere alphanumerique donne une base vide: on la
 * retourne telle quelle et le modele rejette via "Slug produit invalide",
 * comme avant.
 * Jette ProductSlugLimitError au-dela de MAX_NAME_VARIANTS variantes.
 */
const findAvailableProductSlug = async (sellerId, name) => {
  const base = slugify(name);
  if (!base) return base;

  const pattern = new RegExp(`^${escapeRegex(base)}(?:-[0-9]+)?$`);
  const existing = await Product.find({ seller: sellerId, slug: pattern })
    .select("slug")
    .limit(MAX_NAME_VARIANTS)
    .lean();

  if (existing.length >= MAX_NAME_VARIANTS) {
    throw new ProductSlugLimitError();
  }

  const taken = new Set(existing.map((doc) => doc.slug));

  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
};

module.exports = {
  findAvailableProductSlug,
  ProductSlugLimitError,
};
