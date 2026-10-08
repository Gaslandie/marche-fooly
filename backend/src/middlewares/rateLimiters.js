const rateLimit = require("express-rate-limit");

/**
 * Rate limiter applique aux actions publiques qui manipulent un secret ou
 * creent un compte. Les lectures de session GET /me sont volontairement
 * exclues : Next.js les appelle pendant la navigation et elles ne doivent
 * jamais faire paraitre un acheteur deconnecte apres quelques pages.
 *
 * - windowMs: 15 minutes
 * - limit: 30 requetes par IP par fenetre
 * - reponse: format API standard { success, message, data }
 * - standardHeaders: expose les headers RateLimit-* (IETF draft 7)
 * - legacyHeaders: false pour ne pas exposer les anciens X-RateLimit-*
 *
 * Note: 30/15min couvre largement un usage normal (register + login +
 * recuperation de mot de passe + erreurs de saisie) tout en bloquant les
 * tentatives de brute force.
 * Si on veut serrer davantage uniquement login/register, on pourra
 * empiler un second limiter plus strict sur ces deux routes.
 */
const RATE_LIMITED_AUTH_REQUESTS = new Set([
  "POST /register",
  "POST /login",
  "POST /forgot-password",
  "POST /reset-password",
]);

const shouldSkipAuthRateLimit = (req) => {
  // Express accepte la casse différente et le slash final par défaut.
  // Ces variantes doivent garder la même protection que la route normale.
  const path = req.path.toLowerCase().replace(/\/+$/, "");
  return !RATE_LIMITED_AUTH_REQUESTS.has(`${req.method} ${path}`);
};

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: shouldSkipAuthRateLimit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Trop de tentatives. Reessayez dans quelques minutes.",
      data: null,
    });
  },
});

/**
 * Rate limiter general applique aux routes /api/sellers, /api/categories
 * et /api/products. Plus permissif que authRateLimiter car ces routes
 * sont parcourues legitimement par un client de navigation (browse,
 * pagination, recherche).
 *
 * - windowMs: 15 minutes
 * - limit: 300 requetes par IP par fenetre (~20/minute)
 * - Objectif: bloquer le scraping et les boucles agressives sans gener
 *   un utilisateur normal. Si plusieurs utilisateurs partagent une IP
 *   (NAT), 300 reste confortable.
 *
 * Non applique a /api/health (sondes infra) ni a "/" (root).
 */
const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Trop de requetes. Reessayez dans quelques minutes.",
      data: null,
    });
  },
});

/**
 * Rate limiter dedie aux uploads images produit.
 *
 * - windowMs: 15 minutes
 * - limit: 30 uploads par IP par fenetre
 * - Objectif: proteger la memoire et le stockage sans gener un vendeur
 *   normal qui ajoute quelques produits.
 */
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Trop d'uploads. Reessayez dans quelques minutes.",
      data: null,
    });
  },
});

/**
 * Rate limiter strict pour les formulaires PUBLICS sans authentification
 * (POST /api/contact, POST /api/newsletter). Ces routes sont des cibles
 * classiques de bots/spam car elles ne demandent ni JWT ni CAPTCHA au MVP.
 *
 * - windowMs: 15 minutes
 * - limit: 10 requetes par IP par fenetre
 * - Objectif: limiter une vague de spam sans bloquer un utilisateur reel
 *   qui pourrait soumettre 2-3 messages legitimes par session.
 *
 * Note: a empiler avec generalApiRateLimiter si on monte les routes sous
 * un prefixe deja couvert. En pratique on monte /api/contact et
 * /api/newsletter SEULEMENT avec ce limiter dedie, pour ne pas doubler.
 */
const publicFormRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Trop de soumissions. Veuillez reessayer dans quelques minutes.",
      data: null,
    });
  },
});

module.exports = {
  authRateLimiter,
  shouldSkipAuthRateLimit,
  generalApiRateLimiter,
  publicFormRateLimiter,
  uploadRateLimiter,
};
