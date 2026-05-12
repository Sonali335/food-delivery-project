const CustomerProfile = require("../models/CustomerProfile");
const DriverProfile = require("../models/DriverProfile");
const RestaurantProfile = require("../models/RestaurantProfile");
const OtpVerification = require("../models/OtpVerification");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const completeCustomerProfile = async (userId, payload) => {
  const { username, phone, addresses } = payload;

  if (!username || !phone || !Array.isArray(addresses)) {
    throw createError("username, phone, and addresses are required", 400);
  }

  const profile = await CustomerProfile.findOneAndUpdate(
    { userId },
    { userId, username, phone, addresses },
    { new: true, upsert: true, runValidators: true }
  );

  return profile;
};

const completeDriverProfile = async (userId, payload) => {
  const { username, phone, vehicleType, vehicleNumber, licenseNumber } = payload;

  if (!username || !phone || !vehicleType || !vehicleNumber || !licenseNumber) {
    throw createError(
      "username, phone, vehicleType, vehicleNumber, and licenseNumber are required",
      400
    );
  }

  const profile = await DriverProfile.findOneAndUpdate(
    { userId },
    { userId, username, phone, vehicleType, vehicleNumber, licenseNumber },
    { new: true, upsert: true, runValidators: true }
  );

  return profile;
};

const completeRestaurantProfile = async (userId, payload) => {
  const { restaurantName, phone, location } = payload;

  if (!restaurantName || !phone || !location) {
    throw createError("restaurantName, phone, location are required", 400);
  }

  const profile = await RestaurantProfile.findOneAndUpdate(
    { userId },
    { userId, restaurantName, phone, location },
    { new: true, upsert: true, runValidators: true }
  );

  return profile;
};

const getProfileForUser = async (userId, role) => {
  if (role === "customer") {
    return CustomerProfile.findOne({ userId }).lean();
  }
  if (role === "driver") {
    return DriverProfile.findOne({ userId }).lean();
  }
  if (role === "restaurant") {
    return RestaurantProfile.findOne({ userId }).lean();
  }
  throw createError("Unsupported role", 400);
};

const updatePassword = async (userId, { currentPassword, newPassword, confirmPassword }) => {
  if (!newPassword || !confirmPassword) {
    throw createError("New password and confirm password are required", 400);
  }
  if (newPassword !== confirmPassword) {
    throw createError("New password and confirmation do not match", 400);
  }
  if (newPassword.length < 6) {
    throw createError("New password must be at least 6 characters", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw createError("User not found", 404);
  }

  if (user.password) {
    if (!currentPassword) {
      throw createError("Current password is required", 400);
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw createError("Current password is incorrect", 401);
    }
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
};

const deleteProfileAndAccount = async (userId, role) => {
  if (role === "customer") {
    await CustomerProfile.deleteOne({ userId });
  } else if (role === "driver") {
    await DriverProfile.deleteOne({ userId });
  } else if (role === "restaurant") {
    await RestaurantProfile.deleteOne({ userId });
  } else {
    throw createError("Unsupported role", 400);
  }

  await OtpVerification.deleteMany({ userId });
  await User.deleteOne({ _id: userId });
};

module.exports = {
  completeCustomerProfile,
  completeDriverProfile,
  completeRestaurantProfile,
  getProfileForUser,
  updatePassword,
  deleteProfileAndAccount,
};
