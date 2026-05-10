const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

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
    throw createError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email: normalizedEmail,
    password: hashedPassword,
    role,
    accountStatus: "active",
    isVerified: true,
  });

  const jwtToken = generateToken(user);
  const userData = user.toObject();
  delete userData.password;

  return { message: "Account created", user: userData, token: jwtToken };
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
  login,
};
