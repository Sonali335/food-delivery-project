import { useEffect, useState } from "react";
import { getRestaurantSettings } from "../api/restaurant";
import { connectSocket } from "../socket";

const DRIVER_LOCATION_EVENT = "driver:location";

const driverLocationsById = {};
const listeners = new Set();
let socketInitialized = false;
let restaurantCoords = { lat: null, lng: null };
let restaurantCoordsLoaded = false;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function mergeDriverLocation(payload) {
  if (!payload?.driverId) return;
  const driverId = String(payload.driverId);
  const prev = driverLocationsById[driverId] || {};
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);

  driverLocationsById[driverId] = {
    ...prev,
    driverId,
    lat: Number.isFinite(lat) ? lat : prev.lat,
    lng: Number.isFinite(lng) ? lng : prev.lng,
    etaToRestaurant:
      payload.etaToRestaurant ?? payload.eta ?? prev.etaToRestaurant ?? null,
    updatedAt: payload.updatedAt || new Date().toISOString(),
    driver: {
      ...(prev.driver || {}),
      ...(payload.driver || {}),
      username: payload.driver?.username ?? payload.username ?? prev.driver?.username,
      phone: payload.driver?.phone ?? payload.phone ?? prev.driver?.phone,
      vehicleType:
        payload.driver?.vehicleType ?? payload.vehicleType ?? prev.driver?.vehicleType,
      vehicleNumber:
        payload.driver?.vehicleNumber ?? payload.vehicleNumber ?? prev.driver?.vehicleNumber,
    },
  };
  notifyListeners();
}

function ensureSocketListener() {
  if (socketInitialized) return;
  const socket = connectSocket();
  if (!socket) return;

  socketInitialized = true;
  socket.on(DRIVER_LOCATION_EVENT, mergeDriverLocation);
}

async function ensureRestaurantCoords() {
  if (restaurantCoordsLoaded) return;
  restaurantCoordsLoaded = true;
  try {
    const { settings } = await getRestaurantSettings();
    const lat = Number(settings?.locationLat);
    const lng = Number(settings?.locationLng);
    restaurantCoords = {
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
    notifyListeners();
  } catch {
    restaurantCoords = { lat: null, lng: null };
  }
}

export function useRestaurantDriverLocations() {
  const [, version] = useState(0);

  useEffect(() => {
    ensureSocketListener();
    ensureRestaurantCoords();

    const bump = () => version((v) => v + 1);
    listeners.add(bump);
    return () => listeners.delete(bump);
  }, []);

  return {
    getDriverLocation: (driverId) =>
      driverId ? driverLocationsById[String(driverId)] || null : null,
    restaurantCoords,
  };
}
