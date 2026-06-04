const menuService = require("../services/menuService");
const { storeMenuImage } = require("../utils/menuImageStorage");

const createMenuItem = async (req, res) => {
  try {
    const item = await menuService.createMenuItem(req.user._id, req.body);
    return res.status(201).json({ item });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getMenuItemsByRestaurant = async (req, res) => {
  try {
    const items = await menuService.getMenuItemsByRestaurant(req.user._id);
    return res.status(200).json({ items });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const item = await menuService.getMenuItemById(req.user._id, req.params.id);
    return res.status(200).json({ item });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const item = await menuService.updateMenuItem(req.user._id, req.params.id, req.body);
    return res.status(200).json({ item });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    await menuService.deleteMenuItem(req.user._id, req.params.id);
    return res.status(200).json({ message: "Menu item deleted" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const uploadMenuImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const url = await storeMenuImage(req.file);
    return res.status(200).json({ url });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Upload failed" });
  }
};

const getMenuByRestaurant = async (req, res) => {
  try {
    const items = await menuService.getMenuByRestaurant(req.params.restaurantId);
    return res.status(200).json({ items });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  createMenuItem,
  getMenuItemsByRestaurant,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImage,
  getMenuByRestaurant,
};
