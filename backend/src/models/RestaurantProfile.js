const mongoose = require("mongoose");

const restaurantProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    restaurantName: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    cuisineType: { type: String, default: null },
    openingHours: { type: String, default: null },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantProfile", restaurantProfileSchema);
