const profileService = require("../services/profileService");

const completeProfile = async (req, res) => {
  try {
    let profile;

    if (req.user.role === "customer") {
      profile = await profileService.completeCustomerProfile(req.user._id, req.body);
    } else if (req.user.role === "driver") {
      profile = await profileService.completeDriverProfile(req.user._id, req.body);
    } else if (req.user.role === "restaurant") {
      profile = await profileService.completeRestaurantProfile(req.user._id, req.body);
    } else {
      return res.status(400).json({ message: "Unsupported role" });
    }

    return res.status(200).json({ message: "Profile completed", profile });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  completeProfile,
};
