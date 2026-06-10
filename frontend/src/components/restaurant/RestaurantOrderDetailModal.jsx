import { useEffect } from "react";
import { createPortal } from "react-dom";
import OrderEtaText from "../OrderEtaText";
import OrderPrepTimeText from "../OrderPrepTimeText";
import {
  avatarColor,
  canRejectOrder,
  customerInitials,
  customerLabel,
  formatOrderTime,
  isActiveOrderStatus,
  itemCount,
  orderShortId,
  primaryOrderAction,
  statusBadgeClass,
  statusDisplayLabel,
} from "../../utils/restaurantOrderDisplay";

function RestaurantOrderDetailModal({
  order,
  onClose,
  onReject,
  onPrimaryAction,
  actionLoading = false,
  actionError = "",
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!order) return null;

  const avatar = avatarColor(order.customerId);
  const count = itemCount(order.items);
  const subtotal = Number(order.totalAmount || 0);
  const primary = primaryOrderAction(order);
  const reject = canRejectOrder(order);
  const active = isActiveOrderStatus(order.status);
  const paid = ["PLACED", "ACCEPTED", "PREPARING", "PICKED_UP", "DELIVERED"].includes(
    order.status
  );

  return createPortal(
    <div className="rd-odm-overlay" role="presentation" onClick={onClose}>
      <div
        className="rd-odm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rd-odm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rd-odm-header">
          <div className="rd-odm-header-left">
            <button type="button" className="rd-odm-icon-btn" onClick={onClose} aria-label="Close">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 id="rd-odm-title" className="rd-odm-order-id">
                {orderShortId(order._id)}
              </h2>
              <div className="rd-odm-status-row">
                {active ? <span className="rd-odm-pulse-dot" /> : null}
                <span className={`rd-odm-status-label ${active ? "rd-odm-status-active" : ""}`}>
                  {active ? "Active" : statusDisplayLabel(order.status)}
                </span>
                <span className={statusBadgeClass(order.status)}>
                  {statusDisplayLabel(order.status)}
                </span>
              </div>
              <OrderPrepTimeText order={order} />
              <OrderEtaText eta={order.eta} />
            </div>
          </div>
          <div className="rd-odm-header-actions">
            <button type="button" className="rd-odm-icon-btn rd-odm-icon-btn-accent" disabled>
              <span className="material-symbols-outlined">share</span>
            </button>
            <button type="button" className="rd-odm-icon-btn" disabled>
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </header>

        <div className="rd-odm-body">
          {actionError ? <div className="rd-alert-error rd-odm-error">{actionError}</div> : null}

          <section className="rd-odm-card">
            <div className="rd-odm-customer-top">
              <div className="rd-odm-customer-info">
                <span
                  className="rd-odm-avatar"
                  style={{ background: avatar.bg, color: avatar.text }}
                >
                  {customerInitials(order.customerId)}
                </span>
                <div>
                  <h3 className="rd-odm-customer-name">{customerLabel(order.customerId)}</h3>
                  <p className="rd-odm-ordered-at">
                    <span className="material-symbols-outlined">schedule</span>
                    Ordered at {formatOrderTime(order.createdAt)}
                  </p>
                </div>
              </div>
              <div className="rd-odm-contact-btns">
                <button type="button" className="rd-odm-contact-btn" disabled title="Coming soon">
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button type="button" className="rd-odm-contact-btn" disabled title="Coming soon">
                  <span className="material-symbols-outlined">chat_bubble</span>
                </button>
              </div>
            </div>
            <div className="rd-odm-address">
              <span className="material-symbols-outlined">location_on</span>
              <div>
                <p className="rd-odm-address-label">Delivery Address</p>
                <p className="rd-odm-address-text">
                  Not provided on this order — customer ID {String(order.customerId).slice(-6)}
                </p>
              </div>
            </div>
          </section>

          <section className="rd-odm-section">
            <h3 className="rd-odm-section-title">
              Order Items
              <span className="rd-odm-item-count">
                {count} {count === 1 ? "Item" : "Items"}
              </span>
            </h3>
            <ul className="rd-odm-items">
              {(order.items || []).map((line, idx) => (
                <li key={`${line.menuItemId}-${idx}`} className="rd-odm-item-card">
                  <div className="rd-odm-item-thumb">
                    <span className="material-symbols-outlined">lunch_dining</span>
                  </div>
                  <div className="rd-odm-item-body">
                    <div className="rd-odm-item-top">
                      <h4>
                        {line.quantity}x {line.name}
                      </h4>
                      <span>${(Number(line.price) * Number(line.quantity)).toFixed(2)}</span>
                    </div>
                    <p className="rd-odm-item-unit">${Number(line.price).toFixed(2)} each</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rd-odm-instructions">
            <h3 className="rd-odm-instructions-title">
              <span className="material-symbols-outlined">note_alt</span>
              Special Instructions
            </h3>
            <p className="rd-odm-instructions-text">
              No special instructions were provided for this order.
            </p>
          </section>

          <section className="rd-odm-card rd-odm-payment">
            <div className="rd-odm-payment-rows">
              <div className="rd-odm-payment-line">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="rd-odm-payment-line">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
            </div>
            <div className="rd-odm-payment-total">
              <span className="rd-odm-total-label">Total</span>
              <div className="rd-odm-total-right">
                <span className="rd-odm-total-amount">${subtotal.toFixed(2)}</span>
                {paid && order.status !== "CANCELLED" ? (
                  <span className="rd-odm-paid-badge">Paid</span>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        {(primary || reject) && (
          <footer className="rd-odm-footer">
            {reject ? (
              <button
                type="button"
                className="rd-odm-btn-reject"
                disabled={actionLoading}
                onClick={() => onReject(order._id)}
              >
                Reject Order
              </button>
            ) : null}
            {primary ? (
              <button
                type="button"
                className="rd-odm-btn-primary"
                disabled={actionLoading}
                onClick={() => onPrimaryAction(order._id, primary.status)}
              >
                {actionLoading ? "Updating…" : primary.label}
              </button>
            ) : null}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}

export default RestaurantOrderDetailModal;
