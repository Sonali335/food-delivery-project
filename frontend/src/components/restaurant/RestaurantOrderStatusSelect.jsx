import { useId } from "react";
import {
  canRestaurantChangeOrderStatus,
  orderStatusKey,
  orderStatusLabel,
  restaurantOrderStatusOptions,
} from "../../utils/orderStatus";

function stopRowClick(e) {
  e.stopPropagation();
}

function RestaurantOrderStatusSelect({
  orderId,
  status,
  disabled = false,
  onStatusChange,
}) {
  const id = useId();
  const options = restaurantOrderStatusOptions(status);
  const canChange = canRestaurantChangeOrderStatus(status);

  if (!canChange) {
    return (
      <span className={`rd-order-status-select-frozen rd-badge rd-badge-${orderStatusKey(status)}`}>
        {orderStatusLabel(status)}
      </span>
    );
  }

  return (
    <label
      className={`rd-order-status-select-wrap rd-order-status-select-wrap-${orderStatusKey(status)}`}
      htmlFor={id}
      onClick={stopRowClick}
      onMouseDown={stopRowClick}
    >
      <select
        id={id}
        className="rd-order-status-select"
        value={status}
        disabled={disabled}
        aria-label={`Change status for order ${orderId}`}
        onClick={stopRowClick}
        onMouseDown={stopRowClick}
        onChange={(e) => {
          stopRowClick(e);
          const nextStatus = e.target.value;
          if (nextStatus !== status) {
            onStatusChange(orderId, nextStatus);
          }
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined rd-order-status-select-icon" aria-hidden>
        expand_more
      </span>
    </label>
  );
}

export default RestaurantOrderStatusSelect;
