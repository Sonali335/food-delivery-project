const { transporter, isSmtpConfigured } = require("../config/email");

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

const sendVerificationEmail = async (email, token) => {
  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5000";
  const verificationLink = `${appBaseUrl}/auth/verify/${token}`;

  if (!isSmtpConfigured()) {
    warnNotSent("Verification link", email, verificationLink);
    return;
  }

  await sendMailSafe({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your account",
    text: `Verify your account by clicking this link: ${verificationLink}`,
  });
};

const sendPasswordResetOtpEmail = async (email, otp) => {
  if (!isSmtpConfigured()) {
    warnNotSent("Password reset OTP", email, otp);
    return;
  }

  await sendMailSafe({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your password",
    text: `Your password reset code is: ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
  });
};

const sendOtpEmail = async (email, otp) => {
  if (!isSmtpConfigured()) {
    warnNotSent("Signup OTP", email, otp);
    return;
  }

  await sendMailSafe({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your verification code",
    text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
  });
};

module.exports = {
  sendVerificationEmail,
  sendOtpEmail,
  sendPasswordResetOtpEmail,
};
