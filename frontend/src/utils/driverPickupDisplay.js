import { calculateDistanceMeters } from "./calculateDistanceMeters";

export const DRIVER_ARRIVED_METERS = 50;
export const DRIVER_ARRIVING_SOON_METERS = 500;
export const DRIVER_ARRIVING_SOON_ETA_MINUTES = 5;

export function shouldShowDriverPickup(order) {
  if (!order?.driverId) return false;
  return order.status === "PREPARING" || order.status === "PICKED_UP";
}

export function resolveDriverPickupStatus(distanceMeters, etaToRestaurantMinutes) {
  if (distanceMeters != null && distanceMeters < DRIVER_ARRIVED_METERS) {
    return { key: "arrived", label: "Arrived" };
  }

  const eta = Number(etaToRestaurantMinutes);
  const arrivingSoonByEta = Number.isFinite(eta) && eta <= DRIVER_ARRIVING_SOON_ETA_MINUTES;
  const arrivingSoonByDistance =
    distanceMeters != null && distanceMeters <= DRIVER_ARRIVING_SOON_METERS;

  if (arrivingSoonByEta || arrivingSoonByDistance) {
    return { key: "arriving_soon", label: "Arriving soon" };
  }

  return { key: "en_route", label: "En route" };
}

export function computeDriverRestaurantDistance(restaurantCoords, driverLocation) {
  if (!restaurantCoords || !driverLocation) return null;
  return calculateDistanceMeters(
    restaurantCoords.lat,
    restaurantCoords.lng,
    driverLocation.lat,
    driverLocation.lng
  );
}

export function formatDriverCoords(location) {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    return "—";
  }
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

export function buildDriverInfoBoxProps(order, getDriverLocation, restaurantCoords) {
  if (!shouldShowDriverPickup(order)) return null;
  const live = getDriverLocation(order.driverId);
  return {
    driverId: order.driverId,
    driver: live?.driver,
    location: live,
    eta: live?.etaToRestaurant,
    restaurantCoords,
  };
}
