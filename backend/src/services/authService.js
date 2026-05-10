const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const OtpVerification = require("../models/OtpVerification");
const CustomerProfile = require("../models/CustomerProfile");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail } = require("./emailService");

const ROLES = ["customer", "driver", "restaurant"];
const OTP_EXPIRY_MINUTES = 10;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const signup = async ({ email, password, role }) => {
  if (!email || !password || !role) {
    throw createError("email, password, and role are required", 400);
  }

  if (!ROLES.includes(role)) {
    throw createError("Invalid role", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw createError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email: normalizedEmail,
    password: hashedPassword,
    role,
    accountStatus: "pending",
    isVerified: false,
  });

  const otpPlain = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const hashedOtp = await bcrypt.hash(otpPlain, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpVerification.create({
    userId: user._id,
    otp: hashedOtp,
    expiresAt,
  });

  await sendOtpEmail(user.email, otpPlain);

  return { message: "OTP sent to your email for verification." };
};

const verifyOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    throw createError("email and otp are required", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw createError("Invalid email or verification code", 400);
  }

  const otpRecord = await OtpVerification.findOne({ userId: user._id }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw createError("No verification code found. Sign up again or request a new code.", 400);
  }

  if (otpRecord.expiresAt < new Date()) {
    await OtpVerification.deleteMany({ userId: user._id });
    throw createError("Verification code has expired", 400);
  }

  const otpString = String(otp).trim();
  const matches = await bcrypt.compare(otpString, otpRecord.otp);
  if (!matches) {
    throw createError("Invalid verification code", 400);
  }

  user.isVerified = true;
  user.accountStatus = "active";
  await user.save();
  await OtpVerification.deleteMany({ userId: user._id });

  return { message: "Email verified successfully." };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw createError("email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw createError("Invalid credentials", 401);
  }

  if (!user.password) {
    throw createError("This account uses Google sign-in.", 401);
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw createError("Invalid credentials", 401);
  }

  if (!user.isVerified) {
    throw createError("Account not verified. Please verify your email.", 403);
  }

  if (user.accountStatus !== "active") {
    throw createError(`Account is ${user.accountStatus}`, 403);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);
  const userData = user.toObject();
  delete userData.password;

  return { user: userData, token };
};

const googleLogin = async ({ idToken }) => {
  if (!idToken) {
    throw createError("idToken is required", 400);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || String(clientId).trim() === "") {
    throw createError("Google sign-in is not configured", 503);
  }

  const client = new OAuth2Client(clientId);
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw createError("Invalid Google token", 401);
  }

  const emailRaw = payload.email;
  if (!emailRaw || typeof emailRaw !== "string") {
    throw createError("Google account has no verified email", 400);
  }

  if (payload.email_verified === false) {
    throw createError("Google email is not verified", 400);
  }

  const normalizedEmail = emailRaw.toLowerCase().trim();
  const displayName = payload.name || payload.given_name || "";

  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      role: "customer",
      isVerified: true,
      accountStatus: "active",
      lastLogin: new Date(),
    });

    await CustomerProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        username: displayName || normalizedEmail.split("@")[0],
        phone: "pending",
        addresses: [],
      },
      { upsert: true, new: true, runValidators: true }
    );
  } else {
    if (user.accountStatus === "suspended") {
      throw createError("Account is suspended", 403);
    }

    if (!user.isVerified || user.accountStatus !== "active") {
      user.isVerified = true;
      user.accountStatus = "active";
    }

    user.lastLogin = new Date();
    await user.save();
  }

  const token = generateToken(user);

  return { token, role: user.role };
};

module.exports = {
  signup,
  verifyOtp,
  login,
  googleLogin,
};
