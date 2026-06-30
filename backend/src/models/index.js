/**
 * Point d'entree unique pour tous les models Mongoose.
 * Cela simplifie les imports dans les controllers et services.
 */
const User = require("./User");
const SellerProfile = require("./SellerProfile");
const Category = require("./Category");
const Product = require("./Product");
const Order = require("./Order");
const Favorite = require("./Favorite");
const Notification = require("./Notification");
const ContactMessage = require("./ContactMessage");
const NewsletterSubscriber = require("./NewsletterSubscriber");

module.exports = {
  User,
  SellerProfile,
  Category,
  Product,
  Order,
  Favorite,
  Notification,
  ContactMessage,
  NewsletterSubscriber,
};
