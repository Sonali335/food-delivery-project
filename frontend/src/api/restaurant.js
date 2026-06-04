import { getApiBase } from "./config";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getStatus = async () => {
  const response = await fetch(`${getApiBase()}/api/restaurant/status`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not load status");
  }
  return result;
};

export const getAllRestaurants = async () => {
  const response = await fetch(`${getApiBase()}/api/restaurant`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not load restaurants");
  }
  return result;
};

export const getRestaurant = async (id) => {
  const response = await fetch(`${getApiBase()}/api/restaurant/${id}`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not load restaurant");
  }
  return result;
};

export const geocodeRestaurantLocation = async (location) => {
  const params = new URLSearchParams({ location });
  const response = await fetch(`${getApiBase()}/api/restaurant/geocode?${params}`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not geocode location");
  }
  return result;
};

export const reverseGeocodeRestaurantLocation = async (lat, lng) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const response = await fetch(`${getApiBase()}/api/restaurant/reverse-geocode?${params}`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not resolve address");
  }
  return result;
};

export const updateStatus = async (status) => {
  const response = await fetch(`${getApiBase()}/api/restaurant/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ status }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not update status");
  }
  return result;
};
