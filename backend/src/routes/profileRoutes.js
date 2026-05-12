const express = require("express");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, profileController.getProfile);
router.post("/complete", authMiddleware, profileController.completeProfile);
router.delete("/", authMiddleware, profileController.deleteProfile);

module.exports = router;
