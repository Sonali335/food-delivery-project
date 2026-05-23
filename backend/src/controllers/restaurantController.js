const restaurantService = require("../services/restaurantService");

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

const getStatus = getRestaurantStatus;

module.exports = {
  getRestaurantStatus,
  getStatus,
  updateRestaurantStatus,
  getAllRestaurants,
  getRestaurantById,
};
