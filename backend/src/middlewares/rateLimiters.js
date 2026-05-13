const rateLimit = require("express-rate-limit");

/**
 * Rate limiter applique sur toutes les routes /api/auth/*.
 *
 * - windowMs: 15 minutes
 * - limit: 30 requetes par IP par fenetre
 * - reponse: format API standard { success, message, data }
 * - standardHeaders: expose les headers RateLimit-* (IETF draft 7)
 * - legacyHeaders: false pour ne pas exposer les anciens X-RateLimit-*
 *
 * Note: 30/15min couvre largement un usage normal (register + login + me
 * + erreurs de saisie) tout en bloquant les tentatives de brute force.
 * Si on veut serrer davantage uniquement login/register, on pourra
 * empiler un second limiter plus strict sur ces deux routes.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
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

module.exports = {
  authRateLimiter,
};
