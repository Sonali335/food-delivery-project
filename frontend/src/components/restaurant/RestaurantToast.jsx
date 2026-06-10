import "./restaurant-notifications.css";

function RestaurantToast({ orderId, onClose }) {
  const shortId = String(orderId || "").slice(-6);

  return (
    <div className="rd-toast" role="status" aria-live="polite">
      <div className="rd-toast-icon" aria-hidden>
        <span className="material-symbols-outlined">notifications_active</span>
      </div>
      <div className="rd-toast-body">
        <p className="rd-toast-title">New Order Received</p>
        <p className="rd-toast-message">Order #{shortId} just arrived.</p>
      </div>
      <button type="button" className="rd-toast-close" onClick={onClose} aria-label="Dismiss">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}

export default RestaurantToast;
