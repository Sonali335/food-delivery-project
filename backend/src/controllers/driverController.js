const DriverProfile = require("../models/DriverProfile");
const { broadcastDriverLocation } = require("../../socket");

const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ message: "lat and lng must be valid numbers" });
    }

    const profile = await DriverProfile.findOneAndUpdate(
      { userId: req.user._id },
      { location: { lat: latNum, lng: lngNum } },
      { new: true, runValidators: true }
    ).lean();

    if (!profile) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    await broadcastDriverLocation(req.user._id, latNum, lngNum, profile);

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  updateLocation,
};
