/**
 * Controller: categoryController
 *
 * Role exact du fichier:
 *   Implemente les 5 endpoints catégories:
 *     - listPublic       GET    /api/categories          (public)
 *     - getPublicBySlug  GET    /api/categories/:slug    (public)
 *     - create           POST   /api/categories          (admin)
 *     - update           PATCH  /api/categories/:id      (admin)
 *     - softDelete       DELETE /api/categories/:id      (admin, isActive:false)
 *
 * Ou il est utilise:
 *   - backend/src/routes/categoryRoutes.js
 *
 * Chaines de middlewares attendues par chaque handler:
 *   - listPublic, getPublicBySlug:  publiques, aucun auth.
 *   - create, update, softDelete:   authenticate + requireRole("admin").
 *
 * Pourquoi pas d'ownership ici:
 *   Les categories sont une taxonomie GLOBALE de la marketplace. Aucun
 *   utilisateur ne "possede" une categorie au sens metier. L'autorisation
 *   se reduit donc a la verification de role admin, sans middleware
 *   d'ownership a la difference d'un SellerProfile (lie a un user).
 *
 * Regles metier importantes:
 *   - Le slug est genere par le modele Mongoose via setter slugify(name).
 *     On ne lit JAMAIS req.body.slug ici (defense en profondeur, deja
 *     refuse par categoryValidators).
 *   - Whitelist UPDATE_CATEGORY_ALLOWED_FIELDS appliquee a chaque
 *     iteration: tout champ hors liste est ignore.
 *   - DELETE = soft-delete (isActive:false). Idempotent: re-DELETE
 *     d'une categorie deja inactive renvoie 200.
 *   - Routes publiques: filtre isActive:true. Les categories desactivees
 *     ne fuient JAMAIS dans le listing public ni dans GET /:slug.
 *   - parentCategory: a la creation, on verifie l'existence du parent.
 *     A la mise a jour, on verifie l'existence ET l'absence de cycle.
 *   - Format de reponse uniforme: { success, message, data }.
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - toPublicCategory(): centralise le shape API. parentCategory est
 *     toujours expose comme string ObjectId ou null (jamais peuple),
 *     pour garder le contrat simple.
 *   - validateParentForUpdate(): detection de cycle via parcours ascendant
 *     borne (max 50 niveaux) — defensif contre cycle pre-existant en base.
 *   - Erreur Mongo 11000 -> 409 lisible (conflit name ou slug).
 */

const Category = require("../models/Category");
const {
  UPDATE_CATEGORY_ALLOWED_FIELDS,
} = require("../validators/categoryValidators");

const MAX_PARENT_DEPTH = 50;

const toPublicCategory = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  description: doc.description || "",
  imageUrl: doc.imageUrl || "",
  parentCategory: doc.parentCategory ? doc.parentCategory.toString() : null,
  isActive: doc.isActive,
  sortOrder: doc.sortOrder,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Verifie que le parent existe en base.
// Retourne { ok: true } ou { ok: false, status, message }.
const validateParentExists = async (candidateParentId) => {
  if (candidateParentId === null || candidateParentId === undefined) {
    return { ok: true };
  }
  const parent = await Category.findById(candidateParentId)
    .select("_id")
    .lean();
  if (!parent) {
    return {
      ok: false,
      status: 422,
      message: "parentCategory introuvable",
    };
  }
  return { ok: true };
};

// Remonte la chaine de parents depuis candidateParentId. Si on rencontre
// targetCategoryId, c'est un cycle (la categorie target serait son propre
// ancetre indirect). Borne par MAX_PARENT_DEPTH pour ne pas boucler si la
// base contient deja un cycle bugue.
const validateNoCycle = async (targetCategoryId, candidateParentId) => {
  if (candidateParentId === null || candidateParentId === undefined) {
    return { ok: true };
  }
  if (String(candidateParentId) === String(targetCategoryId)) {
    return {
      ok: false,
      status: 422,
      message: "Une categorie ne peut pas etre son propre parent",
    };
  }

  let cursor = candidateParentId;
  for (let depth = 0; depth < MAX_PARENT_DEPTH; depth += 1) {
    const node = await Category.findById(cursor)
      .select("parentCategory")
      .lean();
    if (!node || !node.parentCategory) {
      return { ok: true };
    }
    if (String(node.parentCategory) === String(targetCategoryId)) {
      return {
        ok: false,
        status: 422,
        message: "Cycle detecte dans parentCategory",
      };
    }
    cursor = node.parentCategory;
  }

  return {
    ok: false,
    status: 422,
    message: "Profondeur excessive detectee dans parentCategory",
  };
};

const mapDuplicateKeyError = (error) => {
  if (!error || error.code !== 11000) return null;
  const field = Object.keys(error.keyPattern || {})[0] || "name";
  return {
    status: 409,
    body: {
      success: false,
      message:
        field === "slug"
          ? "Une categorie avec ce slug existe deja"
          : "Une categorie avec ce nom existe deja",
      data: { field },
    },
  };
};

// --- Handlers publics --------------------------------------------------------

const listPublic = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    // Filtre optionnel par slug parent. Si le slug parent est introuvable,
    // on renvoie une liste vide (200) plutot que 404 pour simplifier le
    // code cote front.
    if (req.query.parent) {
      const parent = await Category.findOne({
        slug: req.query.parent,
        isActive: true,
      })
        .select("_id")
        .lean();
      if (!parent) {
        return res.status(200).json({
          success: true,
          message: "Liste des categories",
          data: {
            items: [],
            pagination: { page, limit, total: 0, totalPages: 1 },
          },
        });
      }
      filter.parentCategory = parent._id;
    }

    const [items, total] = await Promise.all([
      Category.find(filter)
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Category.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Liste des categories",
      data: {
        items: items.map(toPublicCategory),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getPublicBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Categorie introuvable",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Categorie",
      data: { category: toPublicCategory(category) },
    });
  } catch (error) {
    return next(error);
  }
};

// --- Handlers admin ----------------------------------------------------------

const create = async (req, res, next) => {
  try {
    // Defense en profondeur: meme si le validator a deja filtre, on ne lit
    // que les champs de la whitelist. Aucune lecture de req.body.slug,
    // req.body._id, etc.
    const payload = {};
    for (const field of UPDATE_CATEGORY_ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    }

    // Verification d'existence du parent si fourni.
    const parentCheck = await validateParentExists(payload.parentCategory);
    if (!parentCheck.ok) {
      return res.status(parentCheck.status).json({
        success: false,
        message: parentCheck.message,
        data: null,
      });
    }

    const created = await Category.create(payload);

    return res.status(201).json({
      success: true,
      message: "Categorie creee",
      data: { category: toPublicCategory(created) },
    });
  } catch (error) {
    const dup = mapDuplicateKeyError(error);
    if (dup) return res.status(dup.status).json(dup.body);
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Categorie introuvable",
        data: null,
      });
    }

    // Si parentCategory est dans le body, valider existence + absence de cycle.
    if (Object.prototype.hasOwnProperty.call(req.body, "parentCategory")) {
      const candidateParent = req.body.parentCategory;
      const existsCheck = await validateParentExists(candidateParent);
      if (!existsCheck.ok) {
        return res.status(existsCheck.status).json({
          success: false,
          message: existsCheck.message,
          data: null,
        });
      }
      const cycleCheck = await validateNoCycle(category._id, candidateParent);
      if (!cycleCheck.ok) {
        return res.status(cycleCheck.status).json({
          success: false,
          message: cycleCheck.message,
          data: null,
        });
      }
    }

    // Application des champs whitelistes. Le slug n'est PAS dans la liste:
    // il reste celui calcule a la creation initiale, sauf si name change
    // ET qu'on souhaite reslugifier (cf. choix B Jour 16: slug stable).
    // Choix: ICI le slug reste stable. Si l'admin veut changer le slug, il
    // doit recreer la categorie ou ajouter une route admin dediee plus tard.
    for (const field of UPDATE_CATEGORY_ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        category[field] = req.body[field];
      }
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Categorie mise a jour",
      data: { category: toPublicCategory(category) },
    });
  } catch (error) {
    const dup = mapDuplicateKeyError(error);
    if (dup) return res.status(dup.status).json(dup.body);
    return next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Categorie introuvable",
        data: null,
      });
    }

    // Idempotent: si deja inactive, on renvoie 200 sans rien changer.
    if (category.isActive === false) {
      return res.status(200).json({
        success: true,
        message: "Categorie deja desactivee",
        data: { category: toPublicCategory(category) },
      });
    }

    category.isActive = false;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Categorie desactivee",
      data: { category: toPublicCategory(category) },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listPublic,
  getPublicBySlug,
  create,
  update,
  softDelete,
};
