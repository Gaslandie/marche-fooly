const Notification = require("../models/Notification");
const User = require("../models/User");
const { BACKOFFICE_ROLES } = require("../models/shared/constants");
const { sendNotificationEmail } = require("../utils/mailer");

const toRecipientId = (recipient) => {
  if (!recipient) return null;
  if (recipient._id) return recipient._id;
  return recipient;
};

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  href = "",
  metadata = {},
  email = false,
  emailSubject = "",
}) => {
  const recipientId = toRecipientId(recipient);
  if (!recipientId) return null;

  const notification = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    href,
    metadata,
  });

  if (!email) return notification;

  const user =
    recipient && recipient.email
      ? recipient
      : await User.findById(recipientId).select("email firstName lastName");

  if (!user?.email) return notification;

  deliverNotificationEmail({
    notification,
    to: user.email,
    subject: emailSubject || title,
    title,
    message,
    href,
  });

  return notification;
};

const deliverNotificationEmail = async ({
  notification,
  to,
  subject,
  title,
  message,
  href,
}) => {
  try {
    const emailResult = await sendNotificationEmail({
      to,
      subject,
      title,
      message,
      href,
    });

    if (emailResult.sent) {
      notification.emailSentAt = new Date();
      await notification.save();
    }
  } catch (error) {
    notification.emailError = error?.message || "Erreur email";
    await notification.save();
    console.warn(
      "Notification email non envoyee:",
      notification._id.toString(),
      notification.emailError,
    );
  }
};

const safeCreateNotification = async (payload) => {
  try {
    return await createNotification(payload);
  } catch (error) {
    console.warn("Notification interne non creee:", error?.message || error);
    return null;
  }
};

const notifyBackOffice = async ({
  type,
  title,
  message,
  href = "/admin",
  metadata = {},
  email = false,
}) => {
  const users = await User.find({
    role: { $in: BACKOFFICE_ROLES },
    status: "active",
  }).select("_id email firstName lastName");

  await Promise.all(
    users.map((user) =>
      safeCreateNotification({
        recipient: user,
        type,
        title,
        message,
        href,
        metadata,
        email,
      }),
    ),
  );
};

module.exports = {
  createNotification,
  safeCreateNotification,
  notifyBackOffice,
};
