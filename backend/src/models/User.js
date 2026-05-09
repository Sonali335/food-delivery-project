const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "driver", "restaurant"],
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
