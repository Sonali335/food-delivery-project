import {
  computeDriverRestaurantDistance,
  formatDriverCoords,
  resolveDriverPickupStatus,
} from "../../utils/driverPickupDisplay";

function driverDisplayName(driver, driverId) {
  if (driver?.username) return driver.username;
  if (driverId) return `Driver ${String(driverId).slice(-4).toUpperCase()}`;
  return "Assigned driver";
}

function formatEta(etaToRestaurant) {
  const minutes = Number(etaToRestaurant);
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  return `${Math.round(minutes)} min to restaurant`;
}

function formatUpdatedAt(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

function DriverInfoBox({ driver, driverId, location, eta, distance, restaurantCoords }) {
  const resolvedLocation =
    location?.lat != null && location?.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null;

  const distanceMeters =
    distance != null
      ? distance
      : computeDriverRestaurantDistance(restaurantCoords, resolvedLocation);

  const pickupStatus = resolveDriverPickupStatus(distanceMeters, eta);
  const etaLabel = formatEta(eta);
  const updatedLabel = formatUpdatedAt(location?.updatedAt);
  const vehicleType = driver?.vehicleType;
  const vehicleNumber = driver?.vehicleNumber;
  const vehicleLine =
    vehicleType || vehicleNumber
      ? [vehicleType, vehicleNumber].filter(Boolean).join(" · ")
      : "—";

  return (
    <aside className="rd-driver-info-box" aria-label="Driver pickup information">
      <div className="rd-driver-info-head">
        <span className="material-symbols-outlined rd-driver-info-icon">local_shipping</span>
        <h4 className="rd-driver-info-title">Driver info</h4>
        <span className={`rd-driver-info-badge rd-driver-info-badge-${pickupStatus.key}`}>
          {pickupStatus.label}
        </span>
      </div>

      <dl className="rd-driver-info-grid">
        <div>
          <dt>Name</dt>
          <dd>{driverDisplayName(driver, driverId)}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{driver?.phone || "—"}</dd>
        </div>
        <div>
          <dt>Vehicle</dt>
          <dd>{vehicleLine}</dd>
        </div>
        <div>
          <dt>Last location</dt>
          <dd>{formatDriverCoords(resolvedLocation)}</dd>
        </div>
        {etaLabel ? (
          <div>
            <dt>ETA to restaurant</dt>
            <dd>{etaLabel}</dd>
          </div>
        ) : null}
        {distanceMeters != null ? (
          <div>
            <dt>Distance</dt>
            <dd>{Math.round(distanceMeters)} m</dd>
          </div>
        ) : null}
        {updatedLabel ? (
          <div>
            <dt>Updated</dt>
            <dd>{updatedLabel}</dd>
          </div>
        ) : null}
      </dl>

      {pickupStatus.key === "arrived" ? (
        <p className="rd-driver-info-arrived">
          <span className="material-symbols-outlined">check_circle</span>
          Driver arrived at restaurant
        </p>
      ) : null}
    </aside>
  );
}

export default DriverInfoBox;
