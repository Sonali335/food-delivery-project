const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "FoodDeliveryApp/1.0 (restaurant-settings; contact: local-dev)";

const nominatimFetch = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });
  if (!response.ok) {
    const err = new Error("Geocoding service unavailable");
    err.statusCode = 502;
    throw err;
  }
  return response.json();
};

const geocodeLocation = async (query) => {
  const q = String(query || "").trim();
  if (!q) {
    const err = new Error("location query is required");
    err.statusCode = 400;
    throw err;
  }
  if (q.length > 300) {
    const err = new Error("location query is too long");
    err.statusCode = 400;
    throw err;
  }

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);

  const results = await nominatimFetch(url);
  const hit = Array.isArray(results) ? results[0] : null;
  if (!hit?.lat || !hit?.lon) {
    const err = new Error("Could not find this address on the map");
    err.statusCode = 404;
    throw err;
  }

  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    label: hit.display_name || q,
  };
};

const reverseGeocode = async (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    const err = new Error("lat and lng must be valid numbers");
    err.statusCode = 400;
    throw err;
  }
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    const err = new Error("lat and lng are out of range");
    err.statusCode = 400;
    throw err;
  }

  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(latNum));
  url.searchParams.set("lon", String(lngNum));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const hit = await nominatimFetch(url);
  if (!hit?.display_name) {
    const err = new Error("Could not resolve address for this point");
    err.statusCode = 404;
    throw err;
  }

  const parts = hit.address
    ? {
        street: [hit.address.house_number, hit.address.road || hit.address.pedestrian]
          .filter(Boolean)
          .join(" ")
          .trim(),
        street2: "",
        city:
          hit.address.city ||
          hit.address.town ||
          hit.address.village ||
          hit.address.municipality ||
          hit.address.county ||
          "",
        state: hit.address.state || hit.address.region || "",
        postalCode: hit.address.postcode || "",
        country: hit.address.country || "",
      }
    : null;

  if (parts && !parts.street && (hit.address.shop || hit.address.amenity || hit.address.building)) {
    parts.street = hit.address.shop || hit.address.amenity || hit.address.building;
  }

  return {
    lat: latNum,
    lng: lngNum,
    label: hit.display_name,
    address: parts,
  };
};

module.exports = { geocodeLocation, reverseGeocode };
