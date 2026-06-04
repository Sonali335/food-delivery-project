import { getApiBase } from "../api/config";

/** Resolve menu/restaurant image URLs (Cloudinary absolute or local /uploads). */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) {
    const base = getApiBase();
    return base ? `${base}${trimmed}` : trimmed;
  }
  return trimmed;
}
