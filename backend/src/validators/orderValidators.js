/**
 * Validators: orderValidators
 *
 * Role exact du fichier:
 *   Definit les chaines express-validator des routes commandes:
 *     - createOrderValidators       -> POST   /api/orders
 *     - updateOrderStatusValidators -> PATCH  /api/orders/:reference/status
 *     - paramReferenceValidator     -> :reference
 *     - listOrdersQueryValidators   -> query strings de GET /mine et /seller
 *   Expose aussi les whitelists et listes de champs interdits utilisees
 *   par le controleur (defense en profondeur).
 *
 * Ou il est utilise:
 *   - backend/src/routes/orderRoutes.js (via runValidators).
 *   - backend/src/controllers/orderController.js (whitelist).
 *
 * Prerequis importants:
 *   - express-validator >= 7.
 *   - Bornes alignees sur models/Order.js et models/shared/constants.js
 *     (ORDER_STATUSES, PAYMENT_METHODS, FULFILLMENT_METHODS).
 *
 * Regles de securite / metier (cf. decisions Jour 19):
 *   - Le CLIENT envoie strictement: items[{product,quantity}],
 *     paymentMethod, fulfillmentMethod, shippingAddress (si home_delivery),
 *     customerPhone, notes.
 *   - TOUT le reste est calcule ou derive cote serveur:
 *     customer (depuis JWT), seller (depuis le 1er product), reference
 *     (generee), status (toujours "pending" a la creation), currency
 *     ("GNF" force), subtotalAmount, deliveryFee, totalAmount, placedAt,
 *     deliveredAt, cancelledAt. Ces champs sont en FORBIDDEN.
 *   - Au niveau items[*], le client n'envoie que { product, quantity }.
 *     unitPrice, productName, sku, subtotal sont snapshottes cote serveur.
 *   - shippingAddress: validation conditionnelle deleguee au controleur
 *     (depend de fulfillmentMethod). Le validator se contente du shape.
 *   - quantity: entier strict 1-100. Au-dela on bloque pour limiter
 *     l'impact d'une commande aberrante sur le stock.
 *   - items: max 50 elements (anti-abus, payload bornne).
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - ORDER_REFERENCE_REGEX miroir de Order.js (match du champ reference).
 *   - PHONE_REGEX/SLUG_REGEX reprennent les conventions du backend.
 */

const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  FULFILLMENT_METHODS,
} = require("../models/shared/constants");

const PHONE_REGEX = /^\+?[0-9\s\-()]{8,20}$/;
const ORDER_REFERENCE_REGEX = /^ORD-\d{8}-[A-Z2-9]{5}$/;

// Champs jamais acceptes en entree client (refus 422 explicite).
// Couvre tous les champs derives, calcules ou administratifs.
const FORBIDDEN_AT_CREATE = [
  "customer",
  "seller",
  "reference",
  "status",
  "currency",
  "subtotalAmount",
  "deliveryFee",
  "totalAmount",
  "placedAt",
  "deliveredAt",
  "cancelledAt",
  "_id",
  "id",
  "createdAt",
  "updatedAt",
  "version",
];

// Champs interdits AU NIVEAU des items (snapshots serveur).
// Le client envoie uniquement product + quantity.
const FORBIDDEN_ITEM_FIELDS = [
  "unitPrice",
  "productName",
  "sku",
  "subtotal",
];

// Whitelist body au POST.
const CREATE_ORDER_ALLOWED_FIELDS = [
  "items",
  "paymentMethod",
  "fulfillmentMethod",
  "shippingAddress",
  "customerPhone",
  "notes",
];

const isObjectIdString = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const forbidValidators = (list) =>
  list.map((field) =>
    body(field)
      .not()
      .exists()
      .withMessage(
        `Le champ "${field}" ne peut pas etre fourni par le client`,
      ),
  );

const forbidItemValidators = FORBIDDEN_ITEM_FIELDS.map((field) =>
  body(`items.*.${field}`)
    .not()
    .exists()
    .withMessage(
      `Le champ items[].${field} est calcule cote serveur et ne doit pas etre fourni`,
    ),
);

// --- POST /api/orders ------------------------------------------------------

const createOrderValidators = [
  ...forbidValidators(FORBIDDEN_AT_CREATE),
  ...forbidItemValidators,

  body("items")
    .isArray({ min: 1, max: 50 })
    .withMessage("items: tableau de 1 a 50 articles"),
  body("items.*.product")
    .custom(isObjectIdString)
    .withMessage("items[].product: ObjectId valide requis"),
  body("items.*.quantity")
    .isInt({ min: 1, max: 100, allow_leading_zeroes: false })
    .withMessage("items[].quantity: entier entre 1 et 100")
    .toInt(),

  body("paymentMethod")
    .isString()
    .bail()
    .isIn(PAYMENT_METHODS)
    .withMessage(`paymentMethod: doit valoir ${PAYMENT_METHODS.join(", ")}`),
  body("fulfillmentMethod")
    .isString()
    .bail()
    .isIn(FULFILLMENT_METHODS)
    .withMessage(
      `fulfillmentMethod: doit valoir ${FULFILLMENT_METHODS.join(", ")}`,
    ),

  body("customerPhone")
    .isString()
    .withMessage("customerPhone requis")
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("customerPhone: format invalide"),

  body("notes")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 800 })
    .withMessage("notes: 800 caracteres maximum"),

  // shippingAddress: shape uniquement; conditionnalite (requise si
  // home_delivery) verifiee dans le controleur.
  body("shippingAddress")
    .optional()
    .isObject()
    .withMessage("shippingAddress: objet attendu"),
  body("shippingAddress.street")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 180 }),
  body("shippingAddress.city")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 80 }),
  body("shippingAddress.region")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 80 }),
  body("shippingAddress.country")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 80 }),
  body("shippingAddress.postalCode")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 20 }),
];

// --- PATCH /api/orders/:reference/status -----------------------------------
// Le client envoie uniquement { status: "<target>" }. Le controleur fait
// la machine d'etat (transitions autorisees selon role et statut courant).
const updateOrderStatusValidators = [
  body("status")
    .isString()
    .withMessage("status requis")
    .bail()
    .isIn(ORDER_STATUSES)
    .withMessage(`status: doit valoir ${ORDER_STATUSES.join(", ")}`),
  // Aucun autre champ n'est accepte dans ce PATCH.
  // On refuse explicitement les classiques pour bloquer toute tentative
  // de modifier la commande via ce point d'entree.
  body("totalAmount").not().exists().withMessage("Champ interdit ici"),
  body("subtotalAmount").not().exists().withMessage("Champ interdit ici"),
  body("deliveryFee").not().exists().withMessage("Champ interdit ici"),
  body("items").not().exists().withMessage("Les items ne peuvent pas etre modifies"),
  body("customer").not().exists().withMessage("Champ interdit ici"),
  body("seller").not().exists().withMessage("Champ interdit ici"),
  body("reference").not().exists().withMessage("Champ interdit ici"),
];

// --- Params -----------------------------------------------------------------

const paramReferenceValidator = [
  param("reference")
    .isString()
    .bail()
    .toUpperCase()
    .matches(ORDER_REFERENCE_REGEX)
    .withMessage("reference invalide (format ORD-YYYYMMDD-XXXXX attendu)"),
];

// --- Query (listings) ------------------------------------------------------

const listOrdersQueryValidators = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("page doit etre un entier >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit doit etre un entier entre 1 et 100"),
  query("status")
    .optional()
    .isString()
    .bail()
    .isIn(ORDER_STATUSES)
    .withMessage(`status: doit valoir ${ORDER_STATUSES.join(", ")}`),
];

module.exports = {
  createOrderValidators,
  updateOrderStatusValidators,
  paramReferenceValidator,
  listOrdersQueryValidators,
  CREATE_ORDER_ALLOWED_FIELDS,
  FORBIDDEN_AT_CREATE,
  FORBIDDEN_ITEM_FIELDS,
  ORDER_REFERENCE_REGEX,
};
