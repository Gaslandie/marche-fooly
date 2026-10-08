/**
 * Validateurs reutilisables pour tous les schemas du backend.
 * On privilegie des regles simples, strictes et partagees pour rester DRY.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{8,20}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isEmail = (value) => EMAIL_REGEX.test(value);
const isPhoneNumber = (value) => PHONE_REGEX.test(value);
// Validation des nouvelles saisies seulement : les anciens comptes restent lisibles.
const normalizePersonName = (value) =>
  value.normalize("NFC").trim().replace(/\s+/gu, " ");
const isPersonName = (value) =>
  /^(?:\p{L}\p{M}*)+(?:[ ’'\-](?:\p{L}\p{M}*)+)*$/u.test(value);
const normalizeGuineaPhone = (value) => {
  if (typeof value !== "string" || value.length > 32 || !/^[+0-9\s().-]+$/.test(value)) return null;
  const compact = value.replace(/[\s().-]/g, "");
  const national = compact.replace(/^(?:\+224|00224)/, "");
  return /^[1-9][0-9]{8}$/.test(national) ? `+224${national}` : null;
};
// Retrouve aussi les anciennes écritures, sans migration des données.
const guineaPhoneMatch = (phone) => {
  const normalized = normalizeGuineaPhone(phone);
  if (!normalized) throw new Error("Telephone guineen invalide");
  const separator = "[\\s().-]*";
  const prefix = `(?:\\+${separator}2${separator}2${separator}4|0${separator}0${separator}2${separator}2${separator}4)`;
  return new RegExp(`^${separator}(?:${prefix}${separator})?${normalized.slice(4).split("").join(separator)}${separator}$`);
};
const isSlug = (value) => SLUG_REGEX.test(value);
const isNonNegativeInteger = (value) =>
  Number.isInteger(value) && value >= 0;
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const isHttpUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
};

const optionalUrlValidator = {
  validator: (value) => !value || isHttpUrl(value),
  message: "L'URL doit commencer par http:// ou https://",
};

module.exports = {
  isEmail,
  isPhoneNumber,
  normalizePersonName,
  isPersonName,
  normalizeGuineaPhone,
  guineaPhoneMatch,
  isSlug,
  isNonNegativeInteger,
  isPositiveInteger,
  optionalUrlValidator,
};
