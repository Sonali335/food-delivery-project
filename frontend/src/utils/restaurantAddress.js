export const EMPTY_ADDRESS = {
  street: "",
  street2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

/** Build a single line stored in profile.location and sent to geocoders. */
export function composeAddress(parts) {
  const street = (parts.street || "").trim();
  const street2 = (parts.street2 || "").trim();
  const city = (parts.city || "").trim();
  const state = (parts.state || "").trim();
  const postalCode = (parts.postalCode || "").trim();
  const country = (parts.country || "").trim();

  const line1 = [street, street2].filter(Boolean).join(", ");
  const cityLine = [city, state, postalCode].filter(Boolean).join(" ");

  return [line1, cityLine, country].filter(Boolean).join(", ");
}

/** Legacy profiles only have one location string — show it in street until edited. */
export function addressFromStoredLocation(location) {
  const text = (location || "").trim();
  if (!text) return { ...EMPTY_ADDRESS };
  return { ...EMPTY_ADDRESS, street: text };
}

export function addressFromNominatim(addr = {}) {
  const street = [addr.house_number, addr.road || addr.pedestrian || addr.footway]
    .filter(Boolean)
    .join(" ")
    .trim();
  const place =
    addr.shop || addr.amenity || addr.building || addr.house || addr.retail;
  const streetLine = street || (place ? String(place) : "");

  return {
    street: streetLine,
    street2: "",
    city:
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      "",
    state: addr.state || addr.region || "",
    postalCode: addr.postcode || "",
    country: addr.country || "",
  };
}

export function isAddressComplete(parts) {
  return !!(composeAddress(parts).trim() && (parts.street || "").trim() && (parts.city || "").trim());
}
