const User = require("../models/User");
const { verifyAuthToken } = require("../utils/jwt");

/**
 * Middleware d'authentification client.
 *
 * Verifie la presence et la validite du JWT puis charge l'utilisateur
 * correspondant en base. On recharge l'utilisateur a chaque requete
 * pour detecter immediatement les comptes supprimes ou suspendus, au
 * prix d'une lecture Mongo supplementaire (acceptable a ce stade).
 *
 * Cas geres:
 *  - 401 token absent ou format invalide
 *  - 401 token invalide ou expire
 *  - 401 utilisateur introuvable (compte supprime)
 *  - 403 utilisateur suspendu
 *
 * En cas de succes: req.user contient le document Mongoose sans le
 * passwordHash (qui reste exclu par `select: false`).
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({
      success: false,
      message: "Authentification requise",
      data: null,
    });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Format d'authentification invalide",
      data: null,
    });
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    const isExpired = error && error.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      message: isExpired ? "Token expire" : "Token invalide",
      data: null,
    });
  }

  if (!payload || !payload.sub) {
    return res.status(401).json({
      success: false,
      message: "Token invalide",
      data: null,
    });
  }

  let user;
  try {
    user = await User.findById(payload.sub);
  } catch (error) {
    return next(error);
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Compte introuvable",
      data: null,
    });
  }

  if (user.status === "suspended") {
    return res.status(403).json({
      success: false,
      message: "Ce compte est suspendu",
      data: null,
    });
  }

  req.user = user;
  return next();
};

module.exports = {
  authenticate,
};
