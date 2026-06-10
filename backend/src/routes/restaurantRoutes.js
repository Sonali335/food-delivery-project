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
  "/settings",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  restaurantController.getRestaurantSettings
);

router.patch(
  "/settings",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  restaurantController.updateRestaurantSettings
);

router.get(
  "/geocode",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  restaurantController.geocodeRestaurantLocation
);

router.get(
  "/reverse-geocode",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  restaurantController.reverseGeocodeRestaurantLocation
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
