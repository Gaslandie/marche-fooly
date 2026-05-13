/**
 * Ce fichier centralise les enums metier utilises par plusieurs schemas.
 * L'objectif est d'eviter les chaines dupliquees et les divergences futures.
 */
const USER_ROLES = ["customer", "seller", "admin"];
const ACCOUNT_STATUSES = ["pending", "active", "suspended"];
const SELLER_STATUSES = ["pending", "approved", "rejected", "suspended"];
const PRODUCT_STATUSES = ["draft", "active", "archived", "out_of_stock"];
const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT_METHODS = ["cash_on_delivery", "pay_on_pickup"];
const FULFILLMENT_METHODS = ["home_delivery", "seller_pickup"];
const CONTACT_MESSAGE_STATUSES = ["new", "in_progress", "resolved", "spam"];
const SUPPORTED_CURRENCIES = ["GNF"];

module.exports = {
  USER_ROLES,
  ACCOUNT_STATUSES,
  SELLER_STATUSES,
  PRODUCT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  FULFILLMENT_METHODS,
  CONTACT_MESSAGE_STATUSES,
  SUPPORTED_CURRENCIES,
};
