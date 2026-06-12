const DriverProfile = require("../models/DriverProfile");
const { broadcastDriverLocation, emitDriverAvailability } = require("../../socket");

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

const updateAvailability = async (req, res) => {
  try {
    const { availabilityStatus } = req.body;

    if (!["online", "offline"].includes(availabilityStatus)) {
      return res.status(400).json({
        message: 'availabilityStatus must be "online" or "offline"',
      });
    }

    const profile = await DriverProfile.findOneAndUpdate(
      { userId: req.user._id },
      { availabilityStatus },
      { new: true, runValidators: true }
    ).lean();

    if (!profile) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    await emitDriverAvailability(req.user._id, availabilityStatus);

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  updateLocation,
  updateAvailability,
};
