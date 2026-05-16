const path = require("path");
const dns = require("dns");
const express = require("express");
const cors = require("cors");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).trim() === "") {
  console.error("❌ JWT_SECRET is missing. Add it to backend/.env (see backend/.env.example).");
  process.exit(1);
}

const { isSmtpConfigured } = require("./config/email");
if (!isSmtpConfigured()) {
  console.warn(
    "[email] SMTP is not configured — OTP emails will not reach your inbox. Copy backend/.env.example into backend/.env and set SMTP_SERVICE=gmail (or SMTP_HOST) plus SMTP_USER and SMTP_PASS, then restart the server."
  );
}

dns.setDefaultResultOrder("ipv4first");
// Node can fail mongodb+srv SRV lookups on some Windows resolver setups; public DNS fixes it.
if (process.platform === "win32" && process.env.MONGO_USE_SYSTEM_DNS !== "1") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    /* ignore */
  }
}

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const menuRoutes = require("./routes/menuRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/menu", menuRoutes);
app.use("/category", categoryRoutes);
app.use("/restaurant", restaurantRoutes);

// connect database
connectDB();

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
