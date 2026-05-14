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

module.exports = router;
