const CustomerProfile = require("../models/CustomerProfile");
const DriverProfile = require("../models/DriverProfile");
const RestaurantProfile = require("../models/RestaurantProfile");

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

module.exports = {
  completeCustomerProfile,
  completeDriverProfile,
  completeRestaurantProfile,
};
