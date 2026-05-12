/**
 * API base URL for fetch().
 * - Dev default: "" → same origin as the Vite tab (localhost or 127.0.0.1), proxied to the backend.
 * - Prod default: direct backend URL unless VITE_API_BASE_URL is set.
 */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return String(fromEnv).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) return "";
  return "http://localhost:5000";
}
