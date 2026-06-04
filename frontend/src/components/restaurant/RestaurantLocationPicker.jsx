import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  geocodeRestaurantLocation,
  reverseGeocodeRestaurantLocation,
} from "../../api/restaurant";
import { composeAddress, EMPTY_ADDRESS } from "../../utils/restaurantAddress";
import { googleMapsSearchUrl, openStreetMapExternalUrl } from "../../utils/mapEmbed";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };
const DEFAULT_ZOOM = 12;
const PIN_ZOOM = 16;

function hasValidCoords(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function RestaurantLocationPicker({
  addressParts,
  lat,
  lng,
  onAddressPartsChange,
  onAddressPartsEdit,
  onPositionChange,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const skipAddressGeocodeRef = useRef(false);
  const geocodeRequestRef = useRef(0);

  const [mapReady, setMapReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mapError, setMapError] = useState("");
  const [geoError, setGeoError] = useState("");

  const parts = addressParts || EMPTY_ADDRESS;
  const searchQuery = useMemo(() => composeAddress(parts), [parts]);
  const trimmed = searchQuery.trim();
  const coordsValid = hasValidCoords(lat, lng);

  const updateField = (field, value) => {
    skipAddressGeocodeRef.current = false;
    const next = { ...parts, [field]: value };
    if (onAddressPartsEdit) {
      onAddressPartsEdit(next);
    } else {
      onAddressPartsChange(next);
    }
    if (!composeAddress(next).trim()) {
      onPositionChange(null, null);
    }
  };

  const applyResolvedAddress = useCallback(
    (result) => {
      if (result.address) {
        onAddressPartsChange({ ...EMPTY_ADDRESS, ...result.address });
        return;
      }
      if (result.label) {
        onAddressPartsChange({ ...EMPTY_ADDRESS, street: result.label });
      }
    },
    [onAddressPartsChange]
  );

  const resolveAddressAt = useCallback(
    async (latitude, longitude) => {
      setBusy(true);
      setMapError("");
      try {
        const result = await reverseGeocodeRestaurantLocation(latitude, longitude);
        applyResolvedAddress(result);
      } catch (e) {
        setMapError(e.message || "Could not resolve address");
        onAddressPartsChange({
          ...EMPTY_ADDRESS,
          street: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
      } finally {
        setBusy(false);
      }
    },
    [applyResolvedAddress, onAddressPartsChange]
  );

  const resolveAddressAtRef = useRef(resolveAddressAt);
  resolveAddressAtRef.current = resolveAddressAt;

  const placeMarker = useCallback((map, latitude, longitude, pan = true) => {
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        skipAddressGeocodeRef.current = true;
        onPositionChange(pos.lat, pos.lng);
        resolveAddressAtRef.current(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    }
    if (pan) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), PIN_ZOOM), { animate: true });
    }
  }, [onPositionChange]);

  const setPositionFromMap = useCallback(
    (latitude, longitude) => {
      skipAddressGeocodeRef.current = true;
      onPositionChange(latitude, longitude);
      if (mapRef.current) {
        placeMarker(mapRef.current, latitude, longitude, true);
      }
      resolveAddressAt(latitude, longitude);
    },
    [onPositionChange, placeMarker, resolveAddressAt]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e) => {
      setPositionFromMap(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    setMapReady(true);

    const timer = setTimeout(() => map.invalidateSize(), 100);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
  }, [setPositionFromMap]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (coordsValid) {
      placeMarker(mapRef.current, lat, lng, !skipAddressGeocodeRef.current);
      skipAddressGeocodeRef.current = false;
      return;
    }

    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    mapRef.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM);
  }, [mapReady, lat, lng, coordsValid, placeMarker]);

  useEffect(() => {
    if (!mapReady || skipAddressGeocodeRef.current) {
      skipAddressGeocodeRef.current = false;
      return undefined;
    }

    if (!trimmed || !(parts.street || "").trim() || !(parts.city || "").trim()) {
      setMapError("");
      return undefined;
    }

    if (coordsValid) {
      return undefined;
    }

    const requestId = ++geocodeRequestRef.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      setMapError("");
      try {
        const result = await geocodeRestaurantLocation(trimmed);
        if (geocodeRequestRef.current !== requestId) return;
        onPositionChange(result.lat, result.lng);
        if (mapRef.current) {
          placeMarker(mapRef.current, result.lat, result.lng, true);
        }
      } catch (e) {
        if (geocodeRequestRef.current !== requestId) return;
        setMapError(e.message || "Could not find this address");
      } finally {
        if (geocodeRequestRef.current === requestId) setBusy(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [trimmed, parts.street, parts.city, mapReady, coordsValid, onPositionChange, placeMarker]);

  const handleUseMyLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        setPositionFromMap(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setBusy(false);
        setGeoError("Could not get your current location. Allow location access or click the map.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="rd-set-location-picker">
      <fieldset className="rd-set-address-fields">
        <legend className="rd-set-address-legend">Street address</legend>
        <div className="rd-set-address-grid">
          <div className="rd-set-field rd-set-field-span2">
            <label htmlFor="addrStreet">Street address</label>
            <input
              id="addrStreet"
              type="text"
              value={parts.street}
              onChange={(e) => updateField("street", e.target.value)}
              placeholder="123 Main Street"
              required
            />
          </div>
          <div className="rd-set-field rd-set-field-span2">
            <label htmlFor="addrStreet2">Apt, suite, unit (optional)</label>
            <input
              id="addrStreet2"
              type="text"
              value={parts.street2}
              onChange={(e) => updateField("street2", e.target.value)}
              placeholder="Unit 4B"
            />
          </div>
          <div className="rd-set-field">
            <label htmlFor="addrCity">City</label>
            <input
              id="addrCity"
              type="text"
              value={parts.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Brampton"
              required
            />
          </div>
          <div className="rd-set-field">
            <label htmlFor="addrState">State / Province</label>
            <input
              id="addrState"
              type="text"
              value={parts.state}
              onChange={(e) => updateField("state", e.target.value)}
              placeholder="Ontario"
            />
          </div>
          <div className="rd-set-field">
            <label htmlFor="addrPostal">Postal / ZIP code</label>
            <input
              id="addrPostal"
              type="text"
              value={parts.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
              placeholder="L6V 4L5"
            />
          </div>
          <div className="rd-set-field">
            <label htmlFor="addrCountry">Country</label>
            <input
              id="addrCountry"
              type="text"
              value={parts.country}
              onChange={(e) => updateField("country", e.target.value)}
              placeholder="Canada"
              required
            />
          </div>
        </div>
        <p className="rd-set-field-hint">
          Fill in your real address, or click the map / use GPS — fields update from the pin.
        </p>
      </fieldset>

      <div className="rd-set-location-actions">
        <button
          type="button"
          className="rd-btn-outline rd-set-location-gps"
          onClick={handleUseMyLocation}
          disabled={busy}
        >
          <span className="material-symbols-outlined">my_location</span>
          Use my current location
        </button>
        {coordsValid ? (
          <span className="rd-set-location-coords">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        ) : null}
      </div>

      {geoError ? <p className="rd-set-location-msg rd-set-location-msg-error">{geoError}</p> : null}
      {mapError ? <p className="rd-set-location-msg rd-set-location-msg-error">{mapError}</p> : null}
      {busy ? (
        <p className="rd-set-location-msg" aria-live="polite">
          Updating map…
        </p>
      ) : null}

      <div className="rd-set-map-leaflet-wrap">
        <div
          ref={mapContainerRef}
          className="rd-set-map-leaflet"
          aria-label="Pick restaurant location on map"
        />
        {!coordsValid && !trimmed ? (
          <div className="rd-set-map-leaflet-hint">
            <span className="material-symbols-outlined">touch_app</span>
            Click anywhere on the map to set your restaurant
          </div>
        ) : null}
      </div>

      {coordsValid ? (
        <div className="rd-set-map-links">
          <a
            href={openStreetMapExternalUrl(lat, lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="rd-set-map-link"
          >
            Open in OpenStreetMap
          </a>
          {trimmed ? (
            <a
              href={googleMapsSearchUrl(trimmed)}
              target="_blank"
              rel="noopener noreferrer"
              className="rd-set-map-link"
            >
              Open in Google Maps
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default RestaurantLocationPicker;
