const path = require("path");
const dns = require("dns");
const express = require("express");
const cors = require("cors");

dns.setDefaultResultOrder("ipv4first");
// Node can fail mongodb+srv SRV lookups on some Windows resolver setups; public DNS fixes it.
if (process.platform === "win32" && process.env.MONGO_USE_SYSTEM_DNS !== "1") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    /* ignore */
  }
}

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());

// connect database
connectDB();

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
