import { useEffect } from "react";
import { updateLocation } from "../api/driver";
import { getProfile } from "../api/profile";
import { connectSocket } from "../socket";

const LOCATION_INTERVAL_MS = 10000;

function useDriverAutoLocation() {
  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    let driverId = null;

    const sendLocation = (lat, lng) => {
      if (cancelled || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

      updateLocation(lat, lng).catch(() => {});

      const socket = connectSocket();
      if (socket?.connected && driverId) {
        socket.emit("driver:location:update", {
          driverId,
          lat,
          lng,
          timestamp: Date.now(),
        });
      }
    };

    const tick = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
      );
    };

    (async () => {
      try {
        const { profile } = await getProfile();
        if (cancelled) return;
        driverId = profile?.userId != null ? String(profile.userId) : null;
      } catch {
        return;
      }

      if (!driverId) return;

      connectSocket();
      tick();
      intervalId = setInterval(tick, LOCATION_INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}

export default useDriverAutoLocation;
