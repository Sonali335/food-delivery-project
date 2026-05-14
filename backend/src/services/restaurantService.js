const RestaurantProfile = require("../models/RestaurantProfile");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getRestaurantStatus = async (userId) => {
  const profile = await RestaurantProfile.findOne({ userId }).lean();
  if (!profile) {
    throw createError("Restaurant profile not found", 404);
  }
  return profile.status || "open";
};

const updateRestaurantStatus = async (userId, status) => {
  const allowed = ["open", "closed", "busy"];
  if (!status || !allowed.includes(status)) {
    throw createError('status must be one of: "open", "closed", "busy"', 400);
  }

  const profile = await RestaurantProfile.findOneAndUpdate(
    { userId },
    { status },
    { new: true, runValidators: true }
  ).lean();

  if (!profile) {
    throw createError("Restaurant profile not found", 404);
  }

  return profile.status;
};

module.exports = {
  getRestaurantStatus,
  updateRestaurantStatus,
};
