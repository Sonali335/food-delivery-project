const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware(["customer"]),
  orderController.createOrder
);

router.get(
  "/customer",
  roleMiddleware(["customer"]),
  orderController.getCustomerOrders
);

router.get(
  "/restaurant",
  roleMiddleware(["restaurant"]),
  orderController.getRestaurantOrders
);

router.get(
  "/driver",
  roleMiddleware(["driver"]),
  orderController.getDriverOrders
);

router.get("/:id", orderController.getOrderById);

router.patch("/:id/status", orderController.updateOrderStatus);

module.exports = router;
