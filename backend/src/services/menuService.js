const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const Category = require("../models/Category");
const RestaurantProfile = require("../models/RestaurantProfile");

const ALLOWED_PREP_TIMES = [10, 15, 20, 25, 30, 35, 40];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizePrepTime = (value) => {
  const minutes = Number(value);
  return ALLOWED_PREP_TIMES.includes(minutes) ? minutes : 20;
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
  const { name, description, price, categoryId, imageUrl, isAvailable, prepTime } = payload;

  if (!name || !String(name).trim()) {
    throw createError("name is required", 400);
  }
  if (price === undefined || price === null || Number.isNaN(Number(price))) {
    throw createError("price is required", 400);
  }
  const priceNum = Number(price);
  if (priceNum < 0) {
    throw createError("price must be zero or greater", 400);
  }
  if (!categoryId) {
    throw createError("categoryId is required", 400);
  }

  await assertValidCategoryForRestaurant(restaurantId, categoryId);

  const created = await MenuItem.create({
    restaurantId,
    name: String(name).trim(),
    description: description != null ? String(description) : "",
    price: priceNum,
    categoryId,
    imageUrl: imageUrl != null && String(imageUrl).trim() !== "" ? String(imageUrl).trim() : null,
    isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
    prepTime: normalizePrepTime(prepTime),
  });

  return MenuItem.findById(created._id)
    .populate({ path: "categoryId", select: "name" })
    .lean();
};

const getMenuItemsByRestaurant = async (restaurantId) => {
  return MenuItem.find({ restaurantId })
    .populate({ path: "categoryId", select: "name" })
    .sort({ createdAt: -1 })
    .lean();
};

const getMenuItemById = async (restaurantId, itemId) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw createError("Invalid menu item id", 400);
  }

  const item = await MenuItem.findOne({ _id: itemId, restaurantId })
    .populate({ path: "categoryId", select: "name" })
    .lean();
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
    const nextPrice = Number(payload.price);
    if (nextPrice < 0) {
      throw createError("price must be zero or greater", 400);
    }
    updates.price = nextPrice;
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
  if (payload.prepTime !== undefined) {
    updates.prepTime = normalizePrepTime(payload.prepTime);
  }

  const item = await MenuItem.findOneAndUpdate({ _id: itemId, restaurantId }, updates, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "categoryId", select: "name" })
    .lean();

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

const getMenuByRestaurant = async (restaurantId) => {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw createError("Invalid restaurant id", 400);
  }

  const items = await MenuItem.find({ restaurantId, isAvailable: true })
    .populate({ path: "categoryId", select: "name" })
    .sort({ createdAt: -1 })
    .lean();

  return items.map((item) => ({
    itemId: item._id,
    name: item.name,
    description: item.description || "",
    price: item.price,
    image: item.imageUrl || null,
    category: item.categoryId?.name || null,
    prepTime: normalizePrepTime(item.prepTime),
  }));
};

const searchMenuItemsForCustomer = async (query) => {
  const q = String(query || "").trim();
  if (!q) {
    return [];
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const items = await MenuItem.find({
    isAvailable: true,
    $or: [{ name: regex }, { description: regex }],
  })
    .populate({ path: "categoryId", select: "name" })
    .sort({ name: 1 })
    .limit(60)
    .lean();

  if (items.length === 0) {
    return [];
  }

  const restaurantIds = [...new Set(items.map((item) => item.restaurantId))];
  const profiles = await RestaurantProfile.find({ userId: { $in: restaurantIds } }).lean();
  const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  return items
    .map((item) => {
      const profile = profileByUserId.get(String(item.restaurantId));
      if (!profile) return null;

      return {
        itemId: item._id,
        name: item.name,
        description: item.description || "",
        price: item.price,
        image: item.imageUrl || null,
        category: item.categoryId?.name || null,
        prepTime: normalizePrepTime(item.prepTime),
        restaurant: {
          id: profile.userId,
          name: profile.restaurantName,
          location: profile.location,
          cuisine: profile.cuisineType || null,
          status: profile.status || "open",
        },
      };
    })
    .filter(Boolean);
};

module.exports = {
  createMenuItem,
  getMenuItemsByRestaurant,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuByRestaurant,
  searchMenuItemsForCustomer,
};
