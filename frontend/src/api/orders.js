import { getApiBase } from "./config";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseResponse = async (response) => {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Order request failed");
  }
  return result;
};

/** @param {{ restaurantId: string, items: { menuItemId: string, name: string, quantity: number, price: number }[] }} payload */
export const createOrder = async (payload) => {
  const response = await fetch(`${getApiBase()}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

/** @returns {Promise<{ order: object }>} */
export const getOrder = async (id) => {
  const response = await fetch(`${getApiBase()}/api/orders/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
  });
  return parseResponse(response);
};

/** @returns {Promise<{ orders: object[] }>} */
export const getCustomerOrders = async () => {
  const response = await fetch(`${getApiBase()}/api/orders/customer`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
  });
  return parseResponse(response);
};

export const getRestaurantOrders = async () => {
  const response = await fetch(`${getApiBase()}/api/orders/restaurant`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  return parseResponse(response);
};

export const getDriverOrders = async () => {
  const response = await fetch(`${getApiBase()}/api/orders/driver`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  return parseResponse(response);
};

export const updateOrderStatus = async (id, status) => {
  const response = await fetch(`${getApiBase()}/api/orders/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
};
