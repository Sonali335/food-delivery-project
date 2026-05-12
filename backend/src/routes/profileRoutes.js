const express = require("express");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, profileController.getProfile);
router.post("/complete", authMiddleware, profileController.completeProfile);
router.post("/password", authMiddleware, profileController.updatePassword);
router.delete("/", authMiddleware, profileController.deleteProfile);

module.exports = router;
