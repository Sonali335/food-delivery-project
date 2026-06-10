const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../src/models/User");

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
    }
  });

  return io;
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
  getIo: () => io,
};
