const restaurantService = require("../services/restaurantService");
const { geocodeLocation, reverseGeocode } = require("../services/geocodeService");

const getRestaurantStatus = async (req, res) => {
  try {
    const status = await restaurantService.getRestaurantStatus(req.user._id);
    return res.status(200).json({ status });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const updateRestaurantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const next = await restaurantService.updateRestaurantStatus(req.user._id, status);
    return res.status(200).json({ status: next });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await restaurantService.getAllRestaurants();
    return res.status(200).json({ restaurants });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    return res.status(200).json({ restaurant });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const geocodeRestaurantLocation = async (req, res) => {
  try {
    const location = req.query.location;
    const result = await geocodeLocation(location);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const reverseGeocodeRestaurantLocation = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const result = await reverseGeocode(lat, lng);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getRestaurantSettings = async (req, res) => {
  try {
    const settings = await restaurantService.getRestaurantSettings(req.user._id);
    return res.status(200).json({ settings });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const updateRestaurantSettings = async (req, res) => {
  try {
    const settings = await restaurantService.updateRestaurantSettings(req.user._id, req.body);
    return res.status(200).json({ settings });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getStatus = getRestaurantStatus;

module.exports = {
  getRestaurantStatus,
  getStatus,
  updateRestaurantSettings,
  getRestaurantSettings,
  updateRestaurantStatus,
  geocodeRestaurantLocation,
  reverseGeocodeRestaurantLocation,
  getAllRestaurants,
  getRestaurantById,
};
