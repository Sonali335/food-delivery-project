import { getApiBase } from "./config";

const NETWORK_ERROR =
  "Cannot reach the server. From the project folder run: npm run dev (starts backend on port 5000 and frontend on 5173).";

/**
 * JSON fetch with clearer errors when the backend is down or unreachable.
 */
export async function apiFetch(path, options = {}) {
  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;

  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}
