const { transporter, isSmtpConfigured } = require("../config/email");

const APP_NAME = process.env.MAIL_APP_NAME || "Food delivery";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function enrichMailSendError(err) {
  const raw = `${err?.message || ""} ${err?.response || ""}`.toLowerCase();
  if (
    raw.includes("535") ||
    raw.includes("badcredentials") ||
    raw.includes("username and password not accepted")
  ) {
    const wrapped = new Error(
      "Gmail rejected SMTP credentials. Use an App Password (Google Account → Security → 2-Step Verification → App passwords), not your normal Gmail password. SMTP_USER must be your full Gmail address. Paste the 16-character app password without extra quotes or spaces. See https://support.google.com/mail/?p=BadCredentials"
    );
    wrapped.cause = err;
    return wrapped;
  }
  return err;
}

async function sendMailSafe(options) {
  try {
    await transporter.sendMail(options);
  } catch (err) {
    throw enrichMailSendError(err);
  }
}

const warnNotSent = (kind, email, secret) => {
  console.warn(
    `[email] ${kind} not sent to ${email} — add SMTP to backend/.env (e.g. SMTP_SERVICE=gmail, SMTP_USER, SMTP_PASS). Dev fallback: ${secret}`
  );
};

/**
 * Simple responsive-style HTML shell for transactional mail (inline CSS only).
 */
function buildOtpEmailHtml({ preheader, heading, intro, otp, minutes, closing, disclaimer }) {
  const brand = escapeHtml(APP_NAME);
  const safeOtp = escapeHtml(String(otp).replace(/\s/g, ""));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;-webkit-font-smoothing:antialiased;">
  <span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(15,23,42,0.08),0 2px 4px -2px rgba(15,23,42,0.06);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:28px 32px 8px 32px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.04em;color:#64748b;text-transform:uppercase;">${brand}</p>
              <h1 style="margin:12px 0 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:600;line-height:1.3;color:#0f172a;">${escapeHtml(heading)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px 32px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
              <p style="margin:0 0 16px 0;">${escapeHtml(intro)}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center" style="padding:20px 16px;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                    <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Your code</p>
                    <p style="margin:0;font-family:ui-monospace,SFMono-Regular,'Cascadia Mono','Segoe UI Mono',Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:0.25em;color:#0f172a;">${safeOtp}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0;font-size:14px;color:#64748b;">This code expires in <strong style="color:#334155;">${minutes} minutes</strong>. For your security, do not share it with anyone.</p>
              <p style="margin:16px 0 0 0;font-size:14px;color:#334155;">${escapeHtml(closing)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px 32px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.5;color:#94a3b8;border-top:1px solid #f1f5f9;">
              <p style="margin:16px 0 0 0;">${escapeHtml(disclaimer)}</p>
              <p style="margin:12px 0 0 0;">© ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const sendPasswordResetOtpEmail = async (email, otp) => {
  const minutes = 10;
  const text = [
    `${APP_NAME} — reset your password`,
    "",
    `Your password reset code is: ${otp}`,
    `This code expires in ${minutes} minutes.`,
    "",
    "If you did not request a password reset, you can safely ignore this email. Your password will not be changed.",
    "",
    `— ${APP_NAME}`,
  ].join("\n");

  const html = buildOtpEmailHtml({
    preheader: `Your reset code is ${otp}. Expires in ${minutes} minutes.`,
    heading: "Reset your password",
    intro:
      "We received a request to reset the password for your account. Enter the code below on the password reset page to continue.",
    otp,
    minutes,
    closing:
      "If you did not make this request, you can ignore this message — your password will stay the same.",
    disclaimer:
      "This is an automated security message. Our team will never ask you for this code by phone or email.",
  });

  if (!isSmtpConfigured()) {
    warnNotSent("Password reset OTP", email, otp);
    return;
  }

  await sendMailSafe({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `${APP_NAME} — password reset code`,
    text,
    html,
  });
};

const sendOtpEmail = async (email, otp) => {
  const minutes = 10;
  const text = [
    `${APP_NAME} — verify your email`,
    "",
    `Your verification code is: ${otp}`,
    `This code expires in ${minutes} minutes.`,
    "",
    "Enter this code on the verification page to complete your registration.",
    "",
    `If you did not create an account, you can ignore this email.`,
    "",
    `— ${APP_NAME}`,
  ].join("\n");

  const html = buildOtpEmailHtml({
    preheader: `Your verification code is ${otp}. Expires in ${minutes} minutes.`,
    heading: "Verify your email address",
    intro:
      "Thank you for signing up. To activate your account, enter the verification code below on the site. This helps us confirm you own this email address.",
    otp,
    minutes,
    closing:
      "Did not create an account? You can disregard this email — no account will be activated without this code.",
    disclaimer:
      "This is an automated message. We will never ask you to share this code outside our official app or website.",
  });

  if (!isSmtpConfigured()) {
    warnNotSent("Signup OTP", email, otp);
    return;
  }

  await sendMailSafe({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `${APP_NAME} — verify your email`,
    text,
    html,
  });
};

module.exports = {
  sendOtpEmail,
  sendPasswordResetOtpEmail,
};
