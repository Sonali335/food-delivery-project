const orderService = require("../services/orderService");

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user, req.body);
    return res.status(201).json({ order });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.user, req.params.id);
    return res.status(200).json({ order });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getCustomerOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrdersForCustomer(req.user._id);
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getRestaurantOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrdersForRestaurant(req.user._id);
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getDriverOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrdersForDriver(req.user._id);
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.user, req.params.id, status);
    return res.status(200).json({ order });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getCustomerOrders,
  getRestaurantOrders,
  getDriverOrders,
  updateOrderStatus,
};
