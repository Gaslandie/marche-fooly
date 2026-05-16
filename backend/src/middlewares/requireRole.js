/**
 * Middleware: requireRole
 *
 * Role exact du fichier:
 *   Autorise l'acces a une route Express uniquement si l'utilisateur
 *   authentifie possede l'un des roles attendus (ex: "admin", "seller").
 *   Implemente comme une factory: requireRole("admin") renvoie un
 *   middleware (req, res, next) pret a etre branche sur un routeur.
 *
 * Ou il est utilise:
 *   - backend/src/routes/sellerRoutes.js (futures routes vendeur protegees)
 *   - backend/src/routes/adminSellerRoutes.js (futures routes admin)
 *   - tout routeur necessitant un controle de role apres authentification.
 *
 * Prerequis importants:
 *   - DOIT etre place APRES le middleware `authenticate` dans la chaine,
 *     car il s'appuie sur `req.user` charge par `authenticate`.
 *     Sans authenticate en amont, le middleware repond 401 par securite
 *     plutot que de planter.
 *   - Les valeurs de role acceptees doivent appartenir a USER_ROLES defini
 *     dans backend/src/models/shared/constants.js
 *     (actuellement: "customer", "seller", "admin").
 *
 * Regles de securite / metier:
 *   - 401 si req.user est absent: signifie qu'authenticate n'a pas tourne
 *     en amont, ou que la requete n'est pas authentifiee. On ne laisse
 *     jamais passer silencieusement.
 *   - 403 si role present mais non autorise: distinction stricte 401/403
 *     conformement a la RFC 7231 (401 = pas authentifie, 403 = authentifie
 *     mais interdit). Cela aide aussi le frontend a differencier les cas.
 *   - Format de reponse uniforme du backend: { success, message, data }.
 *   - Le middleware ne revele jamais le role attendu dans le message
 *     d'erreur (pas d'info leak utile a un attaquant).
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - Signature: requireRole(...allowedRoles: string[]) => RequestHandler
 *   - Usage typique:
 *       router.get("/admin/sellers", authenticate, requireRole("admin"), handler);
 *       router.patch("/sellers/me",  authenticate, requireRole("seller"), handler);
 *   - Plusieurs roles autorises: requireRole("admin", "seller").
 *   - Ne pas confondre avec requireApprovedSeller qui ajoute une regle
 *     metier supplementaire (SellerProfile.status === "approved").
 */

const requireRole = (...allowedRoles) => {
  // Garde-fou developpeur: appeler requireRole() sans argument est
  // forcement une erreur de cablage, on prefere echouer tot et bruyamment.
  if (allowedRoles.length === 0) {
    throw new Error("requireRole(): au moins un role doit etre fourni");
  }

  return (req, res, next) => {
    // Si authenticate n'a pas tourne en amont, req.user est absent.
    // On repond 401 (et pas 500) pour ne jamais laisser passer une
    // requete non authentifiee meme en cas d'erreur de cablage.
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise",
        data: null,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Acces refuse",
        data: null,
      });
    }

    return next();
  };
};

module.exports = {
  requireRole,
};
