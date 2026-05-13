/**
 * Transforme une valeur libre en slug lisible et stable pour les URLs.
 * On centralise cette logique ici pour garder la meme convention partout.
 */
const slugify = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

module.exports = {
  slugify,
};
