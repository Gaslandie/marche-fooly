/**
 * Controller: contactController
 *
 * Role exact du fichier:
 *   Un seul handler:
 *     - create   POST /api/contact   (publique)
 *
 * Ou il est utilise:
 *   - backend/src/routes/contactRoutes.js
 *
 * Chaine de middlewares attendue:
 *   publicFormRateLimiter        (anti-spam, 10/15min/IP)
 *   -> runValidators(createContactMessageValidators)
 *   -> controller.create
 *
 * Regles de securite / metier:
 *   - Route PUBLIQUE (pas d'authenticate), donc pas de req.user.
 *   - Whitelist CREATE_CONTACT_ALLOWED_FIELDS appliquee: tout champ hors
 *     liste est IGNORE meme s'il a passe le validator (defense en
 *     profondeur). Les champs interdits sont deja refuses 422 par les
 *     validators.
 *   - status FORCE a "new" cote serveur. Les admins pourront le faire
 *     evoluer (in_progress / resolved / spam) via une future route admin.
 *   - On retourne uniquement { id, createdAt } et un message de
 *     confirmation. On NE retourne PAS le document complet pour ne pas
 *     exposer status, handledBy, handledAt cote front public.
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - Format de reponse uniforme: { success, message, data }.
 *   - Pas de mapping 11000 (pas d'index unique sur ContactMessage).
 *   - Pas de gestion stock/snapshot/transition: c'est juste un INSERT.
 */

const ContactMessage = require("../models/ContactMessage");
const {
  CREATE_CONTACT_ALLOWED_FIELDS,
} = require("../validators/contactValidators");

const create = async (req, res, next) => {
  try {
    const payload = {};
    for (const field of CREATE_CONTACT_ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    }

    // status est TOUJOURS force serveur a la creation. Le validator
    // refuse deja sa presence dans le body (FORBIDDEN_AT_CREATE), mais
    // on rappelle la regle ici en cas d'evolution future de la whitelist.
    payload.status = "new";

    const created = await ContactMessage.create(payload);

    return res.status(201).json({
      success: true,
      message: "Message recu. Notre equipe vous repondra rapidement.",
      data: {
        contactMessage: {
          id: created._id.toString(),
          createdAt: created.createdAt,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { create };
