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

module.exports = {
  sendNotificationEmail,
};

