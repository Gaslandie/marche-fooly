const SellerProfile = require("../models/SellerProfile");
const User = require("../models/User");
const {
  notifyBackOffice,
  safeCreateNotification,
} = require("./notificationService");

const ORDER_STATUS_LABELS = {
  pending: "en attente",
  confirmed: "confirmée",
  preparing: "en préparation",
  shipped: "expédiée",
  delivered: "livrée",
  cancelled: "annulée",
};

const SELLER_STATUS_LABELS = {
  approved: "approuvée",
  rejected: "refusée",
  suspended: "suspendue",
};

const userName = (user) => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || user?.email || "Utilisateur";
};

const notifySellerApplicationCreated = async ({ profile, applicant }) => {
  await safeCreateNotification({
    recipient: applicant,
    type: "seller_application_created",
    title: "Demande vendeur reçue",
    message:
      "Votre demande vendeur a bien été enregistrée. L'équipe Marché Fooly va l'examiner.",
    href: "/vendeur",
    metadata: { sellerProfileId: profile._id.toString() },
    email: true,
  });

  await notifyBackOffice({
    type: "admin_alert",
    title: "Nouvelle demande vendeur",
    message: `${userName(applicant)} a soumis la boutique ${profile.storeName}.`,
    href: "/admin/vendeurs",
    metadata: { sellerProfileId: profile._id.toString() },
    email: true,
  });
};

const notifySellerStatusChanged = async ({ profile, status }) => {
  await profile.populate("user", "email firstName lastName");

  const title =
    status === "approved"
      ? "Boutique approuvée"
      : status === "rejected"
        ? "Demande vendeur refusée"
        : "Boutique suspendue";

  const message =
    status === "approved"
      ? `Votre boutique ${profile.storeName} est approuvée. Vous pouvez maintenant gérer vos produits.`
      : status === "rejected"
        ? `Votre demande vendeur pour ${profile.storeName} a été refusée. Contactez l'équipe Marché Fooly si vous souhaitez plus d'informations.`
        : `Votre boutique ${profile.storeName} a été suspendue. Contactez l'équipe Marché Fooly pour plus d'informations.`;

  await safeCreateNotification({
    recipient: profile.user,
    type: "seller_application_status",
    title,
    message,
    href: status === "approved" ? "/vendeur" : "/contact",
    metadata: {
      sellerProfileId: profile._id.toString(),
      status,
      statusLabel: SELLER_STATUS_LABELS[status] || status,
    },
    email: true,
  });
};

const notifyOrderCreated = async ({ order }) => {
  const [customer, sellerProfile] = await Promise.all([
    User.findById(order.customer).select("email firstName lastName"),
    SellerProfile.findById(order.seller).populate("user", "email firstName lastName"),
  ]);

  const reference = order.reference;

  if (customer) {
    await safeCreateNotification({
      recipient: customer,
      type: "order_created",
      title: "Commande enregistrée",
      message: `Votre commande ${reference} a bien été enregistrée.`,
      href: `/commande/${reference}`,
      metadata: { orderId: order._id.toString(), reference },
      email: true,
    });
  }

  if (sellerProfile?.user) {
    await safeCreateNotification({
      recipient: sellerProfile.user,
      type: "order_created",
      title: "Nouvelle commande reçue",
      message: `Vous avez reçu la commande ${reference} pour ${sellerProfile.storeName}.`,
      href: `/vendeur/commandes/${reference}`,
      metadata: {
        orderId: order._id.toString(),
        reference,
        sellerProfileId: sellerProfile._id.toString(),
      },
      email: true,
    });
  }
};

const notifyOrderStatusChanged = async ({ order, previousStatus, actor }) => {
  const [customer, sellerProfile] = await Promise.all([
    User.findById(order.customer).select("email firstName lastName"),
    SellerProfile.findById(order.seller).populate("user", "email firstName lastName"),
  ]);

  const reference = order.reference;
  const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
  const title = `Commande ${statusLabel}`;
  const metadata = {
    orderId: order._id.toString(),
    reference,
    previousStatus,
    status: order.status,
  };

  if (customer && actor !== "customer") {
    await safeCreateNotification({
      recipient: customer,
      type: "order_status_updated",
      title,
      message: `Le statut de votre commande ${reference} est maintenant : ${statusLabel}.`,
      href: `/commande/${reference}`,
      metadata,
      email: true,
    });
  }

  if (sellerProfile?.user && actor !== "seller") {
    await safeCreateNotification({
      recipient: sellerProfile.user,
      type: "order_status_updated",
      title,
      message: `La commande ${reference} est maintenant : ${statusLabel}.`,
      href: `/vendeur/commandes/${reference}`,
      metadata,
      email: true,
    });
  }
};

module.exports = {
  notifySellerApplicationCreated,
  notifySellerStatusChanged,
  notifyOrderCreated,
  notifyOrderStatusChanged,
};

