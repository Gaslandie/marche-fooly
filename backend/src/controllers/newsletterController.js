/**
 * Controller: newsletterController
 *
 * Role exact du fichier:
 *   Un seul handler:
 *     - subscribe   POST /api/newsletter   (publique, idempotent)
 *
 * Ou il est utilise:
 *   - backend/src/routes/newsletterRoutes.js
 *
 * Chaine de middlewares attendue:
 *   publicFormRateLimiter        (anti-spam, 10/15min/IP)
 *   -> runValidators(subscribeNewsletterValidators)
 *   -> controller.subscribe
 *
 * Comportement idempotent (decisions R4 et R5):
 *   - email inexistant                       -> 201 cree, isActive=true
 *   - email existant, isActive=true          -> 200, data.alreadySubscribed=true
 *   - email existant, isActive=false         -> reactivation
 *       isActive=true, unsubscribedAt=null, subscribedAt=now
 *       reponse 200, data.alreadySubscribed=false
 *
 * Regles de securite / metier:
 *   - Route PUBLIQUE -> rate-limiter publicFormRateLimiter en amont.
 *   - Whitelist SUBSCRIBE_NEWSLETTER_ALLOWED_FIELDS appliquee.
 *   - isActive, subscribedAt, unsubscribedAt sont entierement administres
 *     serveur. Les validators refusent deja ces champs en entree (422).
 *   - Email normalise lowercase (deja fait par le validator).
 *   - E11000 sur email peut survenir entre findOne et create en cas de
 *     course concurrente: on retombe sur la branche "existant" via
 *     un second findOne pour garder une reponse coherente.
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - Format de reponse uniforme: { success, message, data }.
 *   - On ne renvoie JAMAIS toute la fiche subscriber au client public,
 *     juste { email, alreadySubscribed } pour ne pas exposer source,
 *     subscribedAt, unsubscribedAt qui sont des champs de tracking interne.
 */

const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const {
  SUBSCRIBE_NEWSLETTER_ALLOWED_FIELDS,
} = require("../validators/newsletterValidators");

const subscribe = async (req, res, next) => {
  try {
    const payload = {};
    for (const field of SUBSCRIBE_NEWSLETTER_ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    }

    const email = payload.email;

    // 1) Cherche s'il existe deja un abonne pour cet email.
    const existing = await NewsletterSubscriber.findOne({ email });

    if (existing) {
      if (existing.isActive) {
        // Decision R4: idempotent, pas 409.
        return res.status(200).json({
          success: true,
          message: "Vous etes deja inscrit a la newsletter.",
          data: {
            email: existing.email,
            alreadySubscribed: true,
          },
        });
      }

      // Decision R5: reactivation.
      existing.isActive = true;
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = null;
      if (payload.source) {
        existing.source = payload.source;
      }
      await existing.save();

      return res.status(200).json({
        success: true,
        message: "Inscription a la newsletter reactivee.",
        data: {
          email: existing.email,
          alreadySubscribed: false,
        },
      });
    }

    // 2) Aucun abonne existant -> creation.
    try {
      const created = await NewsletterSubscriber.create({
        email,
        source: payload.source || undefined,
      });

      return res.status(201).json({
        success: true,
        message: "Inscription a la newsletter confirmee.",
        data: {
          email: created.email,
          alreadySubscribed: false,
        },
      });
    } catch (error) {
      // Race condition: un autre POST a cree le doc entre notre findOne
      // et notre create. On verifie et on renvoie une reponse coherente.
      if (error && error.code === 11000) {
        const racing = await NewsletterSubscriber.findOne({ email });
        if (racing && racing.isActive) {
          return res.status(200).json({
            success: true,
            message: "Vous etes deja inscrit a la newsletter.",
            data: {
              email: racing.email,
              alreadySubscribed: true,
            },
          });
        }
      }
      throw error;
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = { subscribe };
