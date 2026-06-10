import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { connectSocket } from "../socket";

const NEW_ORDER_STATUSES = new Set(["NEW", "PLACED"]);
const TOAST_DURATION_MS = 5000;
const SOUND_URL = "/sounds/new-order.mp3";

function isNewOrderStatus(status) {
  return NEW_ORDER_STATUSES.has(String(status || "").toUpperCase());
}

function formatOrderId(orderId) {
  return String(orderId || "").slice(-6);
}

function playBeepFallback() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {
    /* ignore */
  }
}

function playNewOrderSound(playedOrderIds, orderId) {
  if (playedOrderIds.has(orderId)) return;
  playedOrderIds.add(orderId);

  const audio = new Audio(SOUND_URL);
  audio.volume = 0.45;
  audio.play().catch(playBeepFallback);
}

export function useRestaurantNotifications() {
  const location = useLocation();
  const [unseenCount, setUnseenCount] = useState(0);
  const [toast, setToast] = useState(null);
  const notifiedOrderIds = useRef(new Set());
  const playedSoundOrderIds = useRef(new Set());

  const dismissToast = useCallback(() => setToast(null), []);

  const clearBadge = useCallback(() => setUnseenCount(0), []);

  useEffect(() => {
    if (location.pathname === "/restaurant/orders") {
      clearBadge();
    }
  }, [location.pathname, clearBadge]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;

    const onOrderUpdate = (payload) => {
      const orderId = String(payload?.orderId || "");
      const status = payload?.status;

      if (!orderId || !isNewOrderStatus(status)) return;
      if (notifiedOrderIds.current.has(orderId)) return;

      notifiedOrderIds.current.add(orderId);
      setUnseenCount((count) => count + 1);
      setToast({ orderId, key: Date.now() });
      playNewOrderSound(playedSoundOrderIds.current, orderId);
    };

    socket.on("order:update", onOrderUpdate);

    return () => {
      socket.off("order:update", onOrderUpdate);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(dismissToast, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  return {
    unseenCount,
    toast,
    dismissToast,
    clearBadge,
    formatOrderId,
  };
}
