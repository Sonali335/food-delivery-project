import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Merge env so Google Sign-In works if you only set GOOGLE_CLIENT_ID in backend/.env
export default defineConfig(({ mode }) => {
  const repoRoot = path.join(__dirname, "..");
  const backendRoot = path.join(repoRoot, "backend");

  const merged = {
    ...loadEnv(mode, backendRoot, ""),
    ...loadEnv(mode, repoRoot, ""),
    ...loadEnv(mode, __dirname, ""),
  };

  const googleClientId =
    merged.VITE_GOOGLE_CLIENT_ID || merged.GOOGLE_CLIENT_ID || "";

  const apiProxyTarget =
    merged.VITE_API_PROXY_TARGET?.replace(/\/$/, "") || "http://localhost:5000";

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(googleClientId),
    },
    server: {
      proxy: {
        "/auth": { target: apiProxyTarget, changeOrigin: true },
        "/profile": { target: apiProxyTarget, changeOrigin: true },
      },
    },
    preview: {
      proxy: {
        "/auth": { target: apiProxyTarget, changeOrigin: true },
        "/profile": { target: apiProxyTarget, changeOrigin: true },
      },
    },
  };
});
