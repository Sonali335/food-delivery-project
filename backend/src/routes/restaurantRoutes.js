const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const restaurantController = require("../controllers/restaurantController");

const router = express.Router();

router.get(
  "/status",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  restaurantController.getRestaurantStatus
);

router.patch(
  "/status",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  restaurantController.updateRestaurantStatus
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["customer"]),
  restaurantController.getAllRestaurants
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["customer"]),
  restaurantController.getRestaurantById
);

module.exports = router;
