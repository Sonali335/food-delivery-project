const profileService = require("../services/profileService");

const getProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfileForUser(req.user._id, req.user.role);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

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

const deleteProfile = async (req, res) => {
  try {
    await profileService.deleteProfileAndAccount(req.user._id, req.user.role);
    return res.status(200).json({ message: "Profile and account deleted." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    await profileService.updatePassword(req.user._id, req.body);
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  completeProfile,
  deleteProfile,
  updatePassword,
};
