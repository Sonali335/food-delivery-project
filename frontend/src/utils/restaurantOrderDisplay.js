const AVATAR_COLORS = [
  { bg: "#adedd3", text: "#306d58" },
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#f3e8ff", text: "#7c3aed" },
  { bg: "#ffedd5", text: "#c2410c" },
];

export function orderShortId(orderId) {
  return `#FD-${String(orderId).slice(-4).toUpperCase()}`;
}

export function customerLabel(customerId) {
  const id = String(customerId || "");
  return `Customer ${id.slice(-4).toUpperCase()}`;
}

export function customerInitials(customerId) {
  const id = String(customerId || "??");
  return id.slice(-2).toUpperCase();
}

export function avatarColor(customerId) {
  const id = String(customerId || "");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export function itemCount(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
}

export function formatOrderTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function statusDisplayLabel(status) {
  const map = {
    PLACED: "Placed",
    ACCEPTED: "Ready",
    PREPARING: "Preparing",
    PICKED_UP: "Out for delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

export function statusBadgeClass(status) {
  const key = (status || "").toLowerCase();
  return `rd-oh-badge rd-oh-badge-${key}`;
}

export function isActiveOrderStatus(status) {
  return ["PLACED", "ACCEPTED", "PREPARING"].includes(status);
}

export function primaryOrderAction(order) {
  if (!order) return null;
  if (order.status === "PLACED") {
    return { label: "Accept Order", status: "ACCEPTED" };
  }
  if (order.status === "ACCEPTED") {
    return { label: "Start Cooking", status: "PREPARING" };
  }
  return null;
}

export function canRejectOrder(order) {
  return order && ["PLACED", "ACCEPTED", "PREPARING"].includes(order.status);
}

export function matchesOrderSearch(order, query) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const id = String(order._id).toLowerCase();
  const shortId = orderShortId(order._id).toLowerCase();
  const customer = customerLabel(order.customerId).toLowerCase();
  return id.includes(q) || shortId.includes(q) || customer.includes(q);
}
