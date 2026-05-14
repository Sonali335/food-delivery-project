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

module.exports = {
  getRestaurantStatus,
  updateRestaurantStatus,
};
