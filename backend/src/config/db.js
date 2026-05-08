const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = (process.env.MONGO_URI || "").trim();
  if (!uri) {
    console.error("❌ MONGO_URI is missing. Set it in backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error?.message || error);
    const code = error?.code || error?.cause?.code;
    if (code === "ECONNREFUSED" || /querySrv|EAI_AGAIN/i.test(String(error?.message))) {
      console.error(
        "Hint: Atlas SRV lookups can fail behind some networks/DNS. Try: allow your IP in Atlas Network Access," +
          " or use the non-SRV connection string from Atlas (mongodb://…) and update MONGO_URI."
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
