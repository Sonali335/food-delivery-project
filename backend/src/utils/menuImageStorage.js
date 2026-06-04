const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cloudinary = require("../config/cloudinary");

const MENU_UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "menu");

const MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function extensionForFile(file) {
  const fromMime = MIME_EXT[file.mimetype];
  if (fromMime) return fromMime;
  const raw = path.extname(file.originalname || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(raw)) return raw;
  return ".jpg";
}

function saveLocalMenuImage(file) {
  fs.mkdirSync(MENU_UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extensionForFile(file)}`;
  fs.writeFileSync(path.join(MENU_UPLOAD_DIR, filename), file.buffer);
  return `/uploads/menu/${filename}`;
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "food-delivery/menu", resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else if (!result?.secure_url) reject(new Error("Upload returned no URL"));
        else resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

async function storeMenuImage(file) {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file);
  }
  return saveLocalMenuImage(file);
}

module.exports = {
  isCloudinaryConfigured,
  storeMenuImage,
  MENU_UPLOAD_DIR,
};
