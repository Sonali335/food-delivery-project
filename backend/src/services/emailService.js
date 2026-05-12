const transporter = require("../config/email");

const sendVerificationEmail = async (email, token) => {
  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5000";
  const verificationLink = `${appBaseUrl}/auth/verify/${token}`;

  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSmtpConfig) {
    console.log(`Verification link for ${email}: ${verificationLink}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your account",
    text: `Verify your account by clicking this link: ${verificationLink}`,
  });
};

const sendOtpEmail = async (email, otp) => {
  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSmtpConfig) {
    console.log(`OTP for ${email}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your verification code",
    text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
  });
};

module.exports = {
  sendVerificationEmail,
  sendOtpEmail,
};
