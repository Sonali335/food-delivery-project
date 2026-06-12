const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../src/models/User");
const Order = require("../src/models/Order");

const DRIVER_LOCATION_RESTAURANT_STATUSES = ["ACCEPTED", "PREPARING", "PICKED_UP"];

let io = null;

const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token || String(token).trim() === "") {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.user = user;
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = String(socket.user._id);
    const { role } = socket.user;

    if (role === "customer") {
      socket.join(`customer:${userId}`);
    } else if (role === "restaurant") {
      socket.join(`restaurant:${userId}`);
    } else if (role === "driver") {
      socket.join(`driver:${userId}`);
      socket.join("drivers:pool");

      socket.on("driver:location:update", async (payload) => {
        const lat = Number(payload?.lat);
        const lng = Number(payload?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        await broadcastDriverLocation(socket.user._id, lat, lng);
      });
    }
  });

  return io;
};

const broadcastDriverLocation = async (driverId, lat, lng, driverProfile = null) => {
  if (!io || driverId == null) return;

  const orders = await Order.find({
    driverId,
    status: { $in: DRIVER_LOCATION_RESTAURANT_STATUSES },
  }).lean();

  if (!orders.length) return;

  const driver =
    driverProfile != null
      ? {
          username: driverProfile.username,
          phone: driverProfile.phone,
          vehicleType: driverProfile.vehicleType,
          vehicleNumber: driverProfile.vehicleNumber,
        }
      : undefined;

  const updatedAt = new Date();
  const driverIdStr = String(driverId);

  orders.forEach((order) => {
    io.to(`restaurant:${order.restaurantId}`).emit("driver:location", {
      driverId: driverIdStr,
      orderId: String(order._id),
      lat,
      lng,
      updatedAt,
      ...(driver ? { driver } : {}),
    });
  });
};

const emitOrderUpdate = (order) => {
  if (!io || !order) return;

  const payload = {
    orderId: String(order._id),
    status: order.status,
    updatedAt: order.updatedAt,
    eta: order.eta || null,
    prepTimeMinutes: order.prepTimeMinutes ?? null,
  };

  io.to(`customer:${order.customerId}`).emit("order:update", payload);
  io.to(`restaurant:${order.restaurantId}`).emit("order:update", payload);

  if (order.driverId) {
    io.to(`driver:${order.driverId}`).emit("order:update", payload);
  } else if (order.status === "PREPARING") {
    io.to("drivers:pool").emit("order:update", payload);
  }
};

module.exports = {
  initSocket,
  emitOrderUpdate,
  broadcastDriverLocation,
  getIo: () => io,
};
