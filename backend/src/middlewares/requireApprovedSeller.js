/**
 * Middleware: requireApprovedSeller
 *
 * Role exact du fichier:
 *   Protege les routes reservees aux vendeurs APPROUVES (et aux admins).
 *   Verifie qu'un SellerProfile lie a l'utilisateur connecte existe et que
 *   son `status` vaut "approved". Si oui, attache le document Mongoose a
 *   `req.sellerProfile` pour les controleurs en aval.
 *
 * Ou il est utilise:
 *   - backend/src/routes/sellerRoutes.js  (PATCH /api/sellers/me notamment)
 *   - futures routes produits/commandes reservees aux vendeurs actifs.
 *
 * Chaine de middlewares recommandee:
 *   router.post(
 *     "/products",
 *     authenticate,                      // 1) qui es-tu ?
 *     requireRole("seller", "admin"),    // 2) as-tu un role compatible ?
 *     requireApprovedSeller,             // 3) si seller, es-tu APPROUVE ?
 *     productController.createProduct,
 *   );
 *
 * Prerequis importants:
 *   - DOIT s'executer apres `authenticate` (req.user requis).
 *   - L'utilisateur "suspended" est deja bloque en amont par `authenticate`
 *     (403), il n'arrive donc jamais ici.
 *   - Les statuts vendeur valides sont definis dans
 *     backend/src/models/shared/constants.js: SELLER_STATUSES =
 *     ["pending", "approved", "rejected", "suspended"].
 *
 * Regles de securite / metier:
 *   - 401 si req.user est absent (cablage authenticate manquant).
 *   - 403 si role utilisateur n'est ni "seller" ni "admin".
 *   - Cas admin: passe directement sans charger de SellerProfile.
 *       => req.sellerProfile reste UNDEFINED dans ce cas. Les controleurs
 *          en aval qui lisent req.sellerProfile DOIVENT verifier sa
 *          presence (ex: if (req.sellerProfile) { ... }).
 *   - Cas seller: cherche un SellerProfile { user, status: "approved" }.
 *       - Si introuvable -> 403 (couvre pending, rejected, ou profil
 *         inexistant). On ne distingue pas les cas pour eviter de
 *         renseigner un attaquant sur l'etat exact du compte.
 *       - Si trouve -> req.sellerProfile = document Mongoose complet
 *         (modifiable et sauvegardable via .save() si besoin).
 *   - Format de reponse uniforme: { success, message, data }.
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - Signature: requireApprovedSeller(req, res, next) => Promise<void>
 *   - Async: lit Mongo via SellerProfile.findOne(...).
 *   - Erreurs base de donnees: relayees a next(error) pour le handler
 *     d'erreur global d'Express.
 *   - Ne pas confondre avec requireRole, qui ne fait que verifier le
 *     champ `user.role` sans toucher a la base.
 */

const SellerProfile = require("../models/SellerProfile");

const requireApprovedSeller = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise",
        data: null,
      });
    }

    if (!["seller", "admin", "owner"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Acces vendeur requis",
        data: null,
      });
    }

    // Les admins ont acces sans avoir de SellerProfile.
    // req.sellerProfile reste donc undefined: les controleurs en aval
    // doivent en tenir compte (cf. commentaire d'en-tete).
    if (user.role === "admin" || user.role === "owner") {
      return next();
    }

    const sellerProfile = await SellerProfile.findOne({
      user: user._id,
      status: "approved",
    });

    if (!sellerProfile) {
      return res.status(403).json({
        success: false,
        message: "Profil vendeur non approuve",
        data: null,
      });
    }

    req.sellerProfile = sellerProfile;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requireApprovedSeller,
};
