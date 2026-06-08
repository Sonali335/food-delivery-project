import { RESTAURANT_ACTIVE_STATUSES } from "./orderStatus";

export function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function computeRestaurantDashboardStats(orders) {
  const list = Array.isArray(orders) ? orders : [];

  const todayPlaced = list.filter((o) => o.status !== "CANCELLED" && isToday(o.createdAt));
  const todayDelivered = list.filter(
    (o) => o.status === "DELIVERED" && isToday(o.updatedAt || o.createdAt)
  );
  const activeCount = list.filter((o) => RESTAURANT_ACTIVE_STATUSES.includes(o.status)).length;

  return {
    todayOrdersCount: todayPlaced.length,
    todayRevenue: todayDelivered.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
    todayDeliveredCount: todayDelivered.length,
    activeCount,
    totalCount: list.length,
  };
}

export function mergeOrderPatch(orders, orderId, patch) {
  const id = String(orderId);
  const hasMatch = orders.some((o) => String(o._id) === id);
  if (!hasMatch) return orders;
  return orders.map((o) => (String(o._id) === id ? { ...o, ...patch } : o));
}

export function mergeOrderRecord(orders, order) {
  if (!order?._id) return orders;
  return mergeOrderPatch(orders, order._id, order);
}
