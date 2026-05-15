const mongoose = require("mongoose");
const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createCategory = async (restaurantId, { name }) => {
  if (!name || !String(name).trim()) {
    throw createError("name is required", 400);
  }

  const trimmed = String(name).trim();
  const duplicate = await Category.findOne({
    restaurantId,
    name: new RegExp(`^${escapeRegex(trimmed)}$`, "i"),
  }).lean();

  if (duplicate) {
    throw createError("A category with this name already exists", 409);
  }

  const category = await Category.create({
    restaurantId,
    name: trimmed,
  });

  return category;
};

const getCategoriesByRestaurant = async (restaurantId) => {
  return Category.find({ restaurantId }).sort({ createdAt: 1 }).lean();
};

const deleteCategory = async (restaurantId, categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw createError("Invalid category id", 400);
  }

  const category = await Category.findOne({ _id: categoryId, restaurantId });
  if (!category) {
    throw createError("Category not found", 404);
  }

  const inUse = await MenuItem.exists({ categoryId, restaurantId });
  if (inUse) {
    throw createError("Cannot delete category that has menu items", 400);
  }

  await Category.deleteOne({ _id: categoryId, restaurantId });
};

module.exports = {
  createCategory,
  getCategoriesByRestaurant,
  deleteCategory,
};
