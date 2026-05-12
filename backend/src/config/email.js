const nodemailer = require("nodemailer");

/** Gmail “App passwords” are often shown as four groups; SMTP expects 16 chars without spaces. */
function gmailAppPassword() {
  return String(process.env.SMTP_PASS || "").replace(/\s+/g, "");
}

/**
 * True when Nodemailer can send mail: either Gmail preset (SMTP_SERVICE=gmail)
 * or custom SMTP (SMTP_HOST + SMTP_USER + SMTP_PASS). SMTP_PORT defaults to 587.
 */
function isSmtpConfigured() {
  const user = process.env.SMTP_USER?.trim?.();
  const passRaw = process.env.SMTP_PASS;
  if (!user || passRaw == null || String(passRaw).trim() === "") return false;

  if (String(process.env.SMTP_SERVICE || "").toLowerCase() === "gmail") {
    return gmailAppPassword().length > 0;
  }

  return Boolean(process.env.SMTP_HOST?.trim?.());
}

function createTransporter() {
  if (String(process.env.SMTP_SERVICE || "").toLowerCase() === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: gmailAppPassword(),
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
  });
}

const transporter = createTransporter();

module.exports = { transporter, isSmtpConfigured };
