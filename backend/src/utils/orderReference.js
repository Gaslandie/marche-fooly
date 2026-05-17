/**
 * Utilitaire: orderReference
 *
 * Role exact du fichier:
 *   Genere une reference commande unique au format ORD-YYYYMMDD-XXXXX:
 *     - ORD-          prefixe fixe pour identification visuelle
 *     - YYYYMMDD      date UTC de generation (8 chiffres)
 *     - XXXXX         5 caracteres aleatoires d'un alphabet sans ambiguite
 *
 *   Exemple: ORD-20260517-K7M2Q
 *
 * Ou il est utilise:
 *   - backend/src/controllers/orderController.js (au moment du Order.create).
 *
 * Prerequis importants:
 *   - Node >= 19 pour avoir crypto en module standard (cf. .nvmrc=24).
 *   - L'unicite est CONTRACTEE par l'index unique sur Order.reference dans
 *     models/Order.js. Le controleur DOIT gerer le retry E11000 puisqu'on
 *     ne peut pas garantir l'unicite cote generateur seul (la collision
 *     est extremement rare mais non-nulle).
 *
 * Regles de securite / metier:
 *   - On utilise crypto.randomBytes() (CSPRNG) plutot que Math.random()
 *     pour eviter toute prediction par un attaquant qui aurait observe
 *     plusieurs references.
 *   - Alphabet sans 0/O/I/1 pour eviter la confusion visuelle dans les
 *     references imprimees ou dictees au telephone (UX delivery).
 *   - 5 chars * 31 symboles = ~28 millions de combinaisons par jour.
 *     Collision tres improbable a notre echelle MVP.
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - generateOrderReference(): string synchrone, format fixe.
 *   - Date prise en UTC pour stabilite entre serveurs distincts.
 *   - Le format est verrouille par la regex match dans Order.js.
 */

const crypto = require("crypto");

// Alphabet sans ambiguite visuelle: pas de 0/O, 1/I/L pour faciliter la
// lecture humaine (delivery, support client).
const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SUFFIX_LENGTH = 5;

const generateOrderReference = () => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");

  const bytes = crypto.randomBytes(SUFFIX_LENGTH);
  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i += 1) {
    suffix += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }

  return `ORD-${yyyy}${mm}${dd}-${suffix}`;
};

module.exports = {
  generateOrderReference,
  REFERENCE_ALPHABET,
  SUFFIX_LENGTH,
};
