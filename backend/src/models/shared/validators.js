/**
 * Validateurs reutilisables pour tous les schemas du backend.
 * On privilegie des regles simples, strictes et partagees pour rester DRY.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{8,20}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isEmail = (value) => EMAIL_REGEX.test(value);
const isPhoneNumber = (value) => PHONE_REGEX.test(value);
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
  isSlug,
  isNonNegativeInteger,
  isPositiveInteger,
  optionalUrlValidator,
};
