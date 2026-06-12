const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Haversine distance between two lat/lng points in meters. */
export function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const aLat = Number(lat1);
  const aLng = Number(lng1);
  const bLat = Number(lat2);
  const bLng = Number(lng2);

  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) {
    return null;
  }

  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}
