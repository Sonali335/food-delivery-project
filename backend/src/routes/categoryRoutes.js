const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  categoryController.createCategory
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  categoryController.getCategoriesByRestaurant
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  categoryController.deleteCategory
);

module.exports = router;
