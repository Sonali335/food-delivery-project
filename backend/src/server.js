const path = require("path");
const dns = require("dns");
const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { initSocket } = require("../socket");

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
const customerRoutes = require("./routes/customerRoutes");
const menuRoutes = require("./routes/menuRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const driverRoutes = require("./routes/driverRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/category", categoryRoutes);

// connect database
connectDB();

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1,
  });
});

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
