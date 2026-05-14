const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const menuController = require("../controllers/menuController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload-image",
  authMiddleware,
  roleMiddleware(["restaurant"]),
  upload.single("file"),
  menuController.uploadMenuImage
);

router.post("/", authMiddleware, roleMiddleware(["restaurant"]), menuController.createMenuItem);

router.get("/", authMiddleware, roleMiddleware(["restaurant"]), menuController.getMenuItemsByRestaurant);

router.get("/:id", authMiddleware, roleMiddleware(["restaurant"]), menuController.getMenuItemById);

router.patch("/:id", authMiddleware, roleMiddleware(["restaurant"]), menuController.updateMenuItem);

router.delete("/:id", authMiddleware, roleMiddleware(["restaurant"]), menuController.deleteMenuItem);

module.exports = router;
