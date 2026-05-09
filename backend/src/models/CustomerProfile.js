const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false }
);

const customerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: { type: String, required: true },
    phone: { type: String, required: true },
    addresses: { type: [addressSchema], default: [] },
    profileImage: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);
