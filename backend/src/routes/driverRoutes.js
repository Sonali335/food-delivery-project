const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const driverController = require("../controllers/driverController");

const router = express.Router();

router.patch(
  "/location",
  authMiddleware,
  roleMiddleware(["driver"]),
  driverController.updateLocation
);

router.patch(
  "/availability",
  authMiddleware,
  roleMiddleware(["driver"]),
  driverController.updateAvailability
);

module.exports = router;
