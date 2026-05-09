const bcrypt = require("bcrypt");
const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const generateToken = require("../utils/generateToken");
const generateVerificationToken = require("../utils/generateVerificationToken");
const { sendVerificationEmail } = require("./emailService");

const ROLES = ["customer", "driver", "restaurant"];

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
    if (!existingUser.isVerified) {
      await VerificationToken.deleteMany({ userId: existingUser._id });

      const existingToken = generateVerificationToken();
      const existingExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await VerificationToken.create({
        userId: existingUser._id,
        token: existingToken,
        expiresAt: existingExpiresAt,
      });

      await sendVerificationEmail(existingUser.email, existingToken);
      return { message: "Verification email sent" };
    }

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

  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await VerificationToken.create({
    userId: user._id,
    token,
    expiresAt,
  });

  await sendVerificationEmail(user.email, token);

  return { message: "Verification email sent" };
};

const verifyEmail = async (token) => {
  if (!token) {
    throw createError("Verification token is required", 400);
  }

  const verificationToken = await VerificationToken.findOne({ token });
  if (!verificationToken) {
    throw createError("Invalid verification token", 400);
  }

  if (verificationToken.expiresAt < new Date()) {
    await VerificationToken.deleteOne({ _id: verificationToken._id });
    throw createError("Verification token expired", 400);
  }

  const user = await User.findById(verificationToken.userId);
  if (!user) {
    throw createError("User not found", 404);
  }

  user.isVerified = true;
  user.accountStatus = "active";
  await user.save();

  await VerificationToken.deleteMany({ userId: user._id });

  return { message: "Email verified successfully" };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw createError("email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw createError("Invalid credentials", 401);
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw createError("Invalid credentials", 401);
  }

  if (!user.isVerified) {
    throw createError("Email not verified", 403);
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

module.exports = {
  signup,
  verifyEmail,
  login,
};
