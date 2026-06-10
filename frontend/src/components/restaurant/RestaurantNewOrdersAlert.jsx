import "./restaurant-notifications.css";

function RestaurantNewOrdersAlert({
  orders,
  orderActionId,
  onAccept,
  onCancel,
  formatItems,
  customerLabel,
  customerInitials,
  avatarColor,
}) {
  if (!orders.length) return null;

  return (
    <section className="rd-new-orders-alert" aria-label="New orders awaiting acceptance">
      <div className="rd-new-orders-alert-head">
        <span className="material-symbols-outlined rd-new-orders-alert-icon">notifications_active</span>
        <div>
          <h2 className="rd-new-orders-alert-title">
            {orders.length === 1 ? "New order received" : `${orders.length} new orders`}
          </h2>
          <p className="rd-new-orders-alert-sub">Accept to move them into recent orders.</p>
        </div>
      </div>

      <ul className="rd-new-orders-list">
        {orders.map((order) => {
          const avatar = avatarColor(order.customerId);
          const busy = orderActionId === order._id;
          return (
            <li key={order._id} className="rd-new-order-card">
              <div className="rd-new-order-main">
                <span
                  className="rd-avatar"
                  style={{ background: avatar.bg, color: avatar.text }}
                >
                  {customerInitials(order.customerId)}
                </span>
                <div className="rd-new-order-info">
                  <p className="rd-new-order-id">
                    Order #{String(order._id).slice(-6)}
                    <span className="rd-new-order-pill">New</span>
                  </p>
                  <p className="rd-new-order-meta">
                    {customerLabel(order.customerId)} · {formatItems(order.items)}
                  </p>
                </div>
                <p className="rd-new-order-amount">${Number(order.totalAmount).toFixed(2)}</p>
              </div>
              <div className="rd-new-order-actions">
                <button
                  type="button"
                  className="rd-action-btn rd-action-btn-primary"
                  disabled={busy}
                  onClick={() => onAccept(order._id)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="rd-action-btn"
                  disabled={busy}
                  onClick={() => onCancel(order._id)}
                >
                  Cancel
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default RestaurantNewOrdersAlert;
