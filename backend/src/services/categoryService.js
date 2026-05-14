const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createCategory = async (restaurantId, { name }) => {
  if (!name || !String(name).trim()) {
    throw createError("name is required", 400);
  }

  const category = await Category.create({
    restaurantId,
    name: String(name).trim(),
  });

  return category;
};

const getCategoriesByRestaurant = async (restaurantId) => {
  return Category.find({ restaurantId }).sort({ createdAt: 1 }).lean();
};

const deleteCategory = async (restaurantId, categoryId) => {
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
