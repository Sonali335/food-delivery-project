const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const Category = require("../models/Category");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertValidCategoryForRestaurant = async (restaurantId, categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw createError("Invalid categoryId", 400);
  }

  const category = await Category.findOne({ _id: categoryId, restaurantId });
  if (!category) {
    throw createError("Category not found for this restaurant", 400);
  }
};

const createMenuItem = async (restaurantId, payload) => {
  const { name, description, price, categoryId, imageUrl, isAvailable } = payload;

  if (!name || !String(name).trim()) {
    throw createError("name is required", 400);
  }
  if (price === undefined || price === null || Number.isNaN(Number(price))) {
    throw createError("price is required", 400);
  }
  if (!categoryId) {
    throw createError("categoryId is required", 400);
  }

  await assertValidCategoryForRestaurant(restaurantId, categoryId);

  const item = await MenuItem.create({
    restaurantId,
    name: String(name).trim(),
    description: description != null ? String(description) : "",
    price: Number(price),
    categoryId,
    imageUrl: imageUrl != null && String(imageUrl).trim() !== "" ? String(imageUrl).trim() : null,
    isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
  });

  return item;
};

const getMenuItemsByRestaurant = async (restaurantId) => {
  return MenuItem.find({ restaurantId }).sort({ createdAt: -1 }).lean();
};

const getMenuItemById = async (restaurantId, itemId) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw createError("Invalid menu item id", 400);
  }

  const item = await MenuItem.findOne({ _id: itemId, restaurantId }).lean();
  if (!item) {
    throw createError("Menu item not found", 404);
  }
  return item;
};

const updateMenuItem = async (restaurantId, itemId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw createError("Invalid menu item id", 400);
  }

  const existing = await MenuItem.findOne({ _id: itemId, restaurantId });
  if (!existing) {
    throw createError("Menu item not found", 404);
  }

  const updates = {};
  if (payload.name !== undefined) {
    if (!String(payload.name).trim()) throw createError("name cannot be empty", 400);
    updates.name = String(payload.name).trim();
  }
  if (payload.description !== undefined) {
    updates.description = payload.description != null ? String(payload.description) : "";
  }
  if (payload.price !== undefined) {
    if (payload.price === null || Number.isNaN(Number(payload.price))) {
      throw createError("price is invalid", 400);
    }
    updates.price = Number(payload.price);
  }
  if (payload.categoryId !== undefined) {
    await assertValidCategoryForRestaurant(restaurantId, payload.categoryId);
    updates.categoryId = payload.categoryId;
  }
  if (payload.imageUrl !== undefined) {
    updates.imageUrl =
      payload.imageUrl != null && String(payload.imageUrl).trim() !== ""
        ? String(payload.imageUrl).trim()
        : null;
  }
  if (payload.isAvailable !== undefined) {
    if (typeof payload.isAvailable !== "boolean") {
      throw createError("isAvailable must be a boolean", 400);
    }
    updates.isAvailable = payload.isAvailable;
  }

  const item = await MenuItem.findOneAndUpdate({ _id: itemId, restaurantId }, updates, {
    new: true,
    runValidators: true,
  }).lean();

  return item;
};

const deleteMenuItem = async (restaurantId, itemId) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw createError("Invalid menu item id", 400);
  }

  const result = await MenuItem.deleteOne({ _id: itemId, restaurantId });
  if (result.deletedCount === 0) {
    throw createError("Menu item not found", 404);
  }
};

module.exports = {
  createMenuItem,
  getMenuItemsByRestaurant,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
};
