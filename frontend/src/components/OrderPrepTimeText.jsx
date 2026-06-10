import { formatPrepTimeLabel, maxPrepTimeFromItems, normalizePrepTime } from "../utils/prepTime";

function resolvePrepMinutes(order) {
  if (!order) return null;
  if (order.prepTimeMinutes != null) {
    return normalizePrepTime(order.prepTimeMinutes);
  }
  const fromItems = maxPrepTimeFromItems(order.items);
  return fromItems || null;
}

function OrderPrepTimeText({ order, prepTimeMinutes, className = "" }) {
  const minutes =
    prepTimeMinutes != null ? normalizePrepTime(prepTimeMinutes) : resolvePrepMinutes(order);
  if (!minutes) return null;
  return (
    <p className={`order-prep-time-text ${className}`.trim()}>
      Prep time: {formatPrepTimeLabel(minutes)}
    </p>
  );
}

export default OrderPrepTimeText;
