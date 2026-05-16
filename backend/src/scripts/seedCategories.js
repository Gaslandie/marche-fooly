/**
 * Script: seedCategories
 *
 * Role exact du fichier:
 *   Inserer ou mettre a jour les categories initiales de la marketplace.
 *   La liste reprend EXACTEMENT les 14 categories deja definies cote front
 *   dans frontend/src/data/categories.ts pour eviter toute dissonance
 *   front/back (slugs, noms et descriptions sont alignes).
 *
 * Ou il est utilise:
 *   - Manuellement: `node src/scripts/seedCategories.js` depuis backend/
 *   - Optionnellement via un script npm: `npm run seed:categories` (a
 *     ajouter dans backend/package.json si souhaite).
 *
 * Prerequis importants:
 *   - Variable d'environnement MONGODB_URI dans backend/.env, deja chargee
 *     par dotenv via config/env.js. Ici on appelle dotenv directement car
 *     ce script est independant du serveur HTTP.
 *   - MongoDB accessible (Atlas ou local).
 *   - Doit etre lance depuis le dossier backend/ pour que dotenv trouve
 *     le .env (ou definir MONGODB_URI dans l'environnement shell).
 *
 * Regles de securite / metier:
 *   - Script IDEMPOTENT: peut etre relance sans casser quoi que ce soit.
 *     - Si la categorie (par slug) existe -> mise a jour des champs
 *       descriptifs (name, description, sortOrder). isActive remis a
 *       true (pour reactiver une categorie soft-deleted par erreur si
 *       elle fait partie de la base officielle).
 *     - Si elle n'existe pas -> creation.
 *   - Le slug est genere par le modele via le setter slugify(name).
 *     On ne stocke pas le slug en dur dans la liste ci-dessous: on le
 *     calcule a partir du name pour rester aligne sur la logique du
 *     modele.
 *   - Aucun delete: ce script ne supprime jamais. Si une categorie n'est
 *     plus dans la liste, elle reste en base. C'est volontaire pour
 *     proteger les donnees existantes.
 *   - parentCategory force a null: toutes les categories seedees sont
 *     racines. L'organisation hierarchique se fera plus tard via PATCH.
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - Sortie console claire: [CREE], [MAJ], [INCHANGE] par categorie,
 *     suivie d'un resume.
 *   - Code de retour: 0 si succes, 1 si erreur (utile en CI plus tard).
 *   - Ne lance pas le serveur HTTP, n'expose rien sur le reseau.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Category = require("../models/Category");
const { slugify } = require("../utils/slugify");

// Liste alignee sur frontend/src/data/categories.ts (14 entrees).
// L'ordre du tableau definit le sortOrder (index * 10).
const SEED_CATEGORIES = [
  {
    name: "Téléphones & Accessoires",
    description:
      "Smartphones, chargeurs, écouteurs, routeurs et accessoires mobiles.",
  },
  {
    name: "Maison / Cuisine",
    description:
      "Articles maison, ustensiles, déco, équipements pratiques et cuisine.",
  },
  {
    name: "Électroménagers",
    description:
      "Télévisions, machines, équipements électriques et produits maison.",
  },
  {
    name: "Sacs / Bijoux",
    description: "Sacs, accessoires tendance, bijoux, beauté et style local.",
  },
  {
    name: "Alimentation",
    description: "Produits du quotidien et offres alimentaires locales.",
  },
  {
    name: "Automobile",
    description: "Pièces, accessoires auto et services liés à la mobilité.",
  },
  {
    name: "Bébé & Maternité",
    description:
      "Soins, vêtements et accessoires utiles pour bébé et maternité.",
  },
  {
    name: "Fournitures scolaires",
    description: "Articles de bureau, école et accessoires pour l'apprentissage.",
  },
  {
    name: "Instruments musique",
    description: "Son, instruments et accessoires pour création musicale.",
  },
  {
    name: "Livres / Jeux / Jouets",
    description: "Livres, jeux, jouets et produits de loisir pour tous.",
  },
  {
    name: "Meubles",
    description: "Mobilier pratique et décoration pour la maison.",
  },
  {
    name: "Vêtements Femme",
    description: "Mode femme, chaussures et accessoires du quotidien.",
  },
  {
    name: "Vêtements Homme",
    description: "Mode homme, chaussures et essentiels vestimentaires.",
  },
  {
    name: "Vêtements Enfant",
    description: "Tenues, chaussures et accessoires pour enfants.",
  },
];

const fieldsEqual = (doc, payload) => {
  return (
    doc.name === payload.name &&
    (doc.description || "") === (payload.description || "") &&
    doc.sortOrder === payload.sortOrder &&
    doc.isActive === true
  );
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI manquant (verifier backend/.env)");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connecte a MongoDB. Seed de", SEED_CATEGORIES.length, "categories.");

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (let i = 0; i < SEED_CATEGORIES.length; i += 1) {
    const entry = SEED_CATEGORIES[i];
    const slug = slugify(entry.name);
    const payload = {
      name: entry.name,
      description: entry.description,
      sortOrder: i * 10,
      isActive: true,
    };

    const existing = await Category.findOne({ slug });
    if (!existing) {
      await Category.create({ ...payload, parentCategory: null });
      console.log(`[CREE]      ${slug}  -  ${entry.name}`);
      created += 1;
    } else if (fieldsEqual(existing, payload)) {
      console.log(`[INCHANGE]  ${slug}`);
      unchanged += 1;
    } else {
      existing.name = payload.name;
      existing.description = payload.description;
      existing.sortOrder = payload.sortOrder;
      existing.isActive = true;
      await existing.save();
      console.log(`[MAJ]       ${slug}`);
      updated += 1;
    }
  }

  console.log("---");
  console.log(`Resume: ${created} cree(s), ${updated} mise(s) a jour, ${unchanged} inchangee(s)`);

  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur seed:", error && error.message);
    if (error && error.stack) console.error(error.stack);
    process.exit(1);
  });
