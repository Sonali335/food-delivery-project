import { io } from "socket.io-client";

let socket = null;

function getSocketUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return String(fromEnv).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  return "http://localhost:5000";
}

export function getSocket() {
  return socket;
}

export function connectSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      query: { token },
    });
  } else {
    socket.io.opts.query = { token };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
