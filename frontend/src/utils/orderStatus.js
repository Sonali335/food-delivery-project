export const ORDER_STATUS_LABELS = {
  PLACED: "New order",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  PICKED_UP: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const RESTAURANT_ACTIVE_STATUSES = ["PLACED", "ACCEPTED", "PREPARING", "PICKED_UP"];

export const CUSTOMER_ACTIVE_STATUSES = ["PLACED", "ACCEPTED", "PREPARING", "PICKED_UP"];

export function orderStatusLabel(status) {
  if (!status) return "—";
  return ORDER_STATUS_LABELS[status] || status.replace(/_/g, " ");
}

export function orderStatusKey(status) {
  return (status || "").toLowerCase();
}

export function orderStatusBadgeClass(status, prefix) {
  return `${prefix} ${prefix}-${orderStatusKey(status)}`;
}

/** Restaurant dashboard / table primary action for the next step in the flow. */
export function restaurantPrimaryAction(order) {
  if (!order) return null;
  if (order.status === "PLACED") {
    return { label: "Accept", nextStatus: "ACCEPTED" };
  }
  if (order.status === "ACCEPTED") {
    return { label: "Start preparing", nextStatus: "PREPARING" };
  }
  if (order.status === "PREPARING") {
    return { label: "Out for delivery", nextStatus: "PICKED_UP" };
  }
  if (order.status === "PICKED_UP") {
    return { label: "Mark delivered", nextStatus: "DELIVERED" };
  }
  return null;
}

export function restaurantStatusHint(status) {
  const hints = {
    DELIVERED: "Completed",
    CANCELLED: "Cancelled",
  };
  return hints[status] || null;
}

export function canRestaurantCancel(order) {
  return order && ["PLACED", "ACCEPTED", "PREPARING"].includes(order.status);
}

export function isActiveOrderStatus(status) {
  return RESTAURANT_ACTIVE_STATUSES.includes(status);
}
