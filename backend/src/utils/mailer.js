const nodemailer = require("nodemailer");

let transporter = null;

const boolEnv = (value) => value === "true" || value === "1";

const getMailConfig = () => {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = process.env.SMTP_PASS || "";
  const from = (process.env.SMTP_FROM || "").trim();

  return {
    enabled: boolEnv(process.env.NOTIFICATION_EMAIL_ENABLED),
    host,
    port,
    secure: boolEnv(process.env.SMTP_SECURE),
    user,
    pass,
    from,
    replyTo: (process.env.SMTP_REPLY_TO || from).trim(),
    appUrl: (process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:3000")
      .trim()
      .replace(/\/+$/, ""),
  };
};

const isConfigured = (config) =>
  config.enabled && config.host && config.port && config.from;

const getTransporter = (config) => {
  if (transporter) return transporter;

  const auth =
    config.user && config.pass
      ? {
          user: config.user,
          pass: config.pass,
        }
      : undefined;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth,
    // Delais maximaux: un serveur SMTP lent ou injoignable doit echouer
    // proprement en quelques secondes, jamais rester suspendu (sinon la
    // requete HTTP qui l'attend se bloque -> spinner infini cote client).
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return transporter;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const absoluteUrl = (config, href) => {
  if (!href) return config.appUrl;
  if (/^https?:\/\//i.test(href)) return href;
  return `${config.appUrl}${href.startsWith("/") ? href : `/${href}`}`;
};

const sendNotificationEmail = async ({
  to,
  subject,
  title,
  message,
  href,
}) => {
  const config = getMailConfig();

  if (!isConfigured(config) || !to) {
    return { sent: false, skipped: true };
  }

  const actionUrl = absoluteUrl(config, href);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  const info = await getTransporter(config).sendMail({
    from: config.from,
    to,
    replyTo: config.replyTo || undefined,
    subject: subject || title,
    text: `${title}\n\n${message}\n\nVoir sur Marche Fooly: ${actionUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h1 style="font-size:20px;margin:0 0 12px">${safeTitle}</h1>
        <p style="margin:0 0 18px">${safeMessage}</p>
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#ff6b00;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:700">
          Voir sur Marche Fooly
        </a>
      </div>
    `,
  });

  return { sent: true, skipped: false, messageId: info.messageId };
};

/**
 * Indique si l'envoi d'emails est operationnel (flag + SMTP configures).
 * Utilise par le flux "mot de passe oublie" pour repondre honnetement
 * quand la reinitialisation par email n'est pas disponible.
 */
const isMailerEnabled = () => isConfigured(getMailConfig());

/**
 * Email de reinitialisation de mot de passe.
 * `resetPath` est un chemin relatif frontend (avec le token en query) ;
 * l'URL absolue est construite depuis APP_URL/FRONTEND_URL.
 */
const sendPasswordResetEmail = async ({ to, resetPath }) => {
  const config = getMailConfig();

  if (!isConfigured(config) || !to) {
    return { sent: false, skipped: true };
  }

  const resetUrl = absoluteUrl(config, resetPath);
  const safeUrl = escapeHtml(resetUrl);

  const info = await getTransporter(config).sendMail({
    from: config.from,
    to,
    replyTo: config.replyTo || undefined,
    subject: "Reinitialisation de votre mot de passe - Marche Fooly",
    text:
      "Vous avez demande la reinitialisation de votre mot de passe Marche Fooly.\n\n" +
      `Ouvrez ce lien pour choisir un nouveau mot de passe (valable 1 heure) :\n${resetUrl}\n\n` +
      "Si vous n'etes pas a l'origine de cette demande, ignorez cet email : " +
      "votre mot de passe actuel reste inchange.",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h1 style="font-size:20px;margin:0 0 12px">Reinitialisation de votre mot de passe</h1>
        <p style="margin:0 0 18px">
          Vous avez demande la reinitialisation de votre mot de passe Marche Fooly.
          Ce lien est valable <strong>1 heure</strong>.
        </p>
        <a href="${safeUrl}" style="display:inline-block;background:#ff6b00;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:700">
          Choisir un nouveau mot de passe
        </a>
        <p style="margin:18px 0 0;color:#6b7280;font-size:13px">
          Si vous n'etes pas a l'origine de cette demande, ignorez cet email :
          votre mot de passe actuel reste inchange.
        </p>
      </div>
    `,
  });

  return { sent: true, skipped: false, messageId: info.messageId };
};

module.exports = {
  sendNotificationEmail,
  sendPasswordResetEmail,
  isMailerEnabled,
};

