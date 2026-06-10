const mongoose = require("mongoose");
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

const formatRestaurantForCustomer = (profile) => ({
  id: profile.userId,
  name: profile.restaurantName,
  location: profile.location,
  cuisine: profile.cuisineType || null,
  rating: profile.ratingAverage ?? 0,
  image: profile.image || profile.imageUrl || null,
  status: profile.status || "open",
});

const getAllRestaurants = async () => {
  const profiles = await RestaurantProfile.find().sort({ restaurantName: 1 }).lean();
  return profiles.map(formatRestaurantForCustomer);
};

const ALLOWED_PREP_TIMES = [10, 15, 20, 25, 30, 35, 40];

const getRestaurantSettings = async (userId) => {
  const profile = await RestaurantProfile.findOne({ userId }).lean();
  if (!profile) {
    throw createError("Restaurant profile not found", 404);
  }
  const prepTime = ALLOWED_PREP_TIMES.includes(profile.prepTime) ? profile.prepTime : 20;
  return { prepTime };
};

const updateRestaurantSettings = async (userId, payload) => {
  const { prepTime } = payload;
  if (prepTime === undefined) {
    throw createError("prepTime is required", 400);
  }
  const value = Number(prepTime);
  if (!ALLOWED_PREP_TIMES.includes(value)) {
    throw createError("prepTime must be one of: 10, 15, 20, 25, 30, 35, 40", 400);
  }

  const profile = await RestaurantProfile.findOneAndUpdate(
    { userId },
    { prepTime: value },
    { new: true, runValidators: true }
  ).lean();

  if (!profile) {
    throw createError("Restaurant profile not found", 404);
  }

  return { prepTime: profile.prepTime };
};

const getRestaurantById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError("Invalid restaurant id", 400);
  }

  const profile = await RestaurantProfile.findOne({ userId: id }).lean();
  if (!profile) {
    throw createError("Restaurant not found", 404);
  }

  return formatRestaurantForCustomer(profile);
};

module.exports = {
  getRestaurantStatus,
  updateRestaurantStatus,
  getRestaurantSettings,
  updateRestaurantSettings,
  getAllRestaurants,
  getRestaurantById,
};
