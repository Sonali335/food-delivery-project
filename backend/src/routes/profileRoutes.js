const express = require("express");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/complete", authMiddleware, profileController.completeProfile);

module.exports = router;
