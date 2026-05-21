const mongoose = require("mongoose");
const Order = require("../models/Order");
const { ORDER_STATUSES } = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const RestaurantProfile = require("../models/RestaurantProfile");
const { emitOrderUpdate } = require("../../socket");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/** Allowed transitions: fromStatus -> { toStatus: roles[] } */
const TRANSITIONS = {
  PLACED: {
    ACCEPTED: ["restaurant"],
    CANCELLED: ["customer", "restaurant"],
  },
  ACCEPTED: {
    PREPARING: ["restaurant"],
    CANCELLED: ["customer", "restaurant"],
  },
  PREPARING: {
    PICKED_UP: ["driver"],
    CANCELLED: ["restaurant"],
  },
  PICKED_UP: {
    DELIVERED: ["driver"],
  },
  DELIVERED: {},
  CANCELLED: {},
};

const assertValidObjectId = (id, label = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(`Invalid ${label}`, 400);
  }
};

const userCanAccessOrder = (user, order) => {
  const uid = String(user._id);
  if (user.role === "customer") {
    return String(order.customerId) === uid;
  }
  if (user.role === "restaurant") {
    return String(order.restaurantId) === uid;
  }
  if (user.role === "driver") {
    if (order.driverId && String(order.driverId) === uid) {
      return true;
    }
    if (order.status === "PREPARING" && !order.driverId) {
      return true;
    }
  }
  return false;
};

const buildOrderItems = async (restaurantId, itemsPayload) => {
  if (!Array.isArray(itemsPayload) || itemsPayload.length === 0) {
    throw createError("items must be a non-empty array", 400);
  }

  const lineItems = [];
  let totalAmount = 0;

  for (const raw of itemsPayload) {
    const menuItemId = raw?.menuItemId;
    const quantity = Number(raw?.quantity);

    if (!menuItemId) {
      throw createError("Each item requires menuItemId", 400);
    }
    assertValidObjectId(menuItemId, "menuItemId");
    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
      throw createError("Each item requires a positive integer quantity", 400);
    }

    const menuItem = await MenuItem.findOne({
      _id: menuItemId,
      restaurantId,
    }).lean();

    if (!menuItem) {
      throw createError("Menu item not found for this restaurant", 400);
    }
    if (menuItem.isAvailable === false) {
      throw createError(`Menu item "${menuItem.name}" is not available`, 400);
    }

    const lineTotal = menuItem.price * quantity;
    totalAmount += lineTotal;
    lineItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      quantity,
      price: menuItem.price,
    });
  }

  return { lineItems, totalAmount };
};

const createOrder = async (customer, payload) => {
  if (customer.role !== "customer") {
    throw createError("Only customers can create orders", 403);
  }

  const { restaurantId, items } = payload;
  if (!restaurantId) {
    throw createError("restaurantId is required", 400);
  }
  assertValidObjectId(restaurantId, "restaurantId");

  const restaurant = await RestaurantProfile.findOne({ userId: restaurantId }).lean();
  if (!restaurant) {
    throw createError("Restaurant not found", 404);
  }

  const { lineItems, totalAmount } = await buildOrderItems(restaurantId, items);

  const order = await Order.create({
    customerId: customer._id,
    restaurantId,
    items: lineItems,
    totalAmount,
    status: "PLACED",
  });

  const saved = await Order.findById(order._id).lean();
  emitOrderUpdate(saved);
  return saved;
};

const getOrderById = async (user, orderId) => {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw createError("Order not found", 404);
  }
  if (!userCanAccessOrder(user, order)) {
    throw createError("Forbidden", 403);
  }
  return order;
};

const getOrdersForCustomer = async (customerId) => {
  return Order.find({ customerId }).sort({ createdAt: -1 }).lean();
};

const getOrdersForRestaurant = async (restaurantId) => {
  return Order.find({ restaurantId }).sort({ createdAt: -1 }).lean();
};

const getOrdersForDriver = async (driverId) => {
  return Order.find({
    $or: [{ driverId }, { status: "PREPARING", driverId: null }],
  })
    .sort({ createdAt: -1 })
    .lean();
};

const updateOrderStatus = async (actor, orderId, newStatus) => {
  assertValidObjectId(orderId, "order id");

  if (!newStatus || !ORDER_STATUSES.includes(newStatus)) {
    throw createError(
      `status must be one of: ${ORDER_STATUSES.join(", ")}`,
      400
    );
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw createError("Order not found", 404);
  }

  const current = order.status;
  if (current === newStatus) {
    return order.toObject();
  }

  const allowedFromCurrent = TRANSITIONS[current];
  if (!allowedFromCurrent || !allowedFromCurrent[newStatus]) {
    throw createError(
      `Invalid transition from ${current} to ${newStatus}`,
      400
    );
  }

  const allowedRoles = allowedFromCurrent[newStatus];
  if (!allowedRoles.includes(actor.role)) {
    throw createError(
      `Role "${actor.role}" cannot transition order from ${current} to ${newStatus}`,
      403
    );
  }

  if (actor.role === "customer") {
    if (String(order.customerId) !== String(actor._id)) {
      throw createError("Forbidden", 403);
    }
  }

  if (actor.role === "restaurant") {
    if (String(order.restaurantId) !== String(actor._id)) {
      throw createError("Forbidden", 403);
    }
  }

  if (actor.role === "driver") {
    if (newStatus === "PICKED_UP") {
      if (order.driverId && String(order.driverId) !== String(actor._id)) {
        throw createError("Order is assigned to another driver", 403);
      }
      order.driverId = actor._id;
    } else if (String(order.driverId) !== String(actor._id)) {
      throw createError("Forbidden", 403);
    }
  }

  order.status = newStatus;
  await order.save();

  const updated = order.toObject();
  emitOrderUpdate(updated);
  return updated;
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersForCustomer,
  getOrdersForRestaurant,
  getOrdersForDriver,
  updateOrderStatus,
  ORDER_STATUSES,
  TRANSITIONS,
};
