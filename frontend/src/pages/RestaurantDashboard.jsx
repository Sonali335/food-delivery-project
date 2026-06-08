import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRestaurantOrders, updateOrderStatus } from "../api/orders";
import { connectSocket } from "../socket";
import { useRestaurantProfile } from "../components/restaurant/RestaurantProfileContext";
import {
  computeRestaurantDashboardStats,
  mergeOrderPatch,
  mergeOrderRecord,
} from "../utils/restaurantDashboardStats";
import {
  canRestaurantCancel,
  orderStatusBadgeClass,
  orderStatusLabel,
  restaurantPrimaryAction,
  restaurantStatusHint,
} from "../utils/orderStatus";

const AVATAR_COLORS = [
  { bg: "#d1fae5", text: "#047857" },
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#f3e8ff", text: "#7c3aed" },
  { bg: "#ffedd5", text: "#c2410c" },
];

function formatItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items.map((line) => `${line.quantity}x ${line.name}`).join(", ");
}

function customerLabel(customerId) {
  const id = String(customerId || "");
  return `Customer ${id.slice(-4).toUpperCase()}`;
}

function customerInitials(customerId) {
  const id = String(customerId || "??");
  return id.slice(-2).toUpperCase();
}

function avatarColor(customerId) {
  const id = String(customerId || "");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function statusBadgeClass(status) {
  return orderStatusBadgeClass(status, "rd-badge");
}

function RestaurantDashboard() {
  const navigate = useNavigate();
  const { restaurantName } = useRestaurantProfile();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderActionId, setOrderActionId] = useState(null);

  const refreshOrders = useCallback(async () => {
    const { orders: list } = await getRestaurantOrders();
    setOrders(list || []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      setOrdersError("");
      try {
        const { orders: list } = await getRestaurantOrders();
        if (!cancelled) setOrders(list || []);
      } catch (e) {
        if (!cancelled) setOrdersError(e.message || "Failed to load orders");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    loadOrders();

    const socket = connectSocket();
    if (!socket) {
      return () => {
        cancelled = true;
      };
    }

    const onOrderUpdate = (payload) => {
      const orderId = String(payload.orderId);
      setOrders((prev) => {
        if (!prev.some((o) => String(o._id) === orderId)) {
          return prev;
        }
        return mergeOrderPatch(prev, orderId, {
          status: payload.status,
          updatedAt: payload.updatedAt,
        });
      });

      setOrders((prev) => {
        if (prev.some((o) => String(o._id) === orderId)) {
          return prev;
        }
        getRestaurantOrders()
          .then(({ orders: list }) => {
            if (!cancelled) setOrders(list || []);
          })
          .catch(() => {});
        return prev;
      });
    };

    socket.on("order:update", onOrderUpdate);

    const onFocus = () => {
      loadOrders();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      socket.off("order:update", onOrderUpdate);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const stats = useMemo(() => computeRestaurantDashboardStats(orders), [orders]);
  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);

  const handleOrderStatus = async (orderId, nextStatus) => {
    setOrderActionId(orderId);
    setOrdersError("");
    try {
      const { order } = await updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => mergeOrderRecord(prev, order));
      await refreshOrders();
    } catch (e) {
      setOrdersError(e.message || "Order update failed");
    } finally {
      setOrderActionId(null);
    }
  };

  const welcomeName = restaurantName || "your restaurant";

  return (
    <>
      <div className="rd-page-header">
        <div>
          <h1 className="rd-page-title">Dashboard overview</h1>
          <p className="rd-page-subtitle">
            Welcome back, {welcomeName}. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="rd-header-actions">
          <button type="button" className="rd-btn-primary" onClick={() => navigate("/restaurant/menu")}>
            <span className="material-symbols-outlined">add_circle</span>
            Manage menu
          </button>
        </div>
      </div>

      {ordersError ? <div className="rd-alert-error">{ordersError}</div> : null}

      <div className="rd-stats-grid">
        <div className="rd-stat-card">
          <div className="rd-stat-top">
            <div className="rd-stat-icon rd-stat-icon-green">
              <span className="material-symbols-outlined">shopping_basket</span>
            </div>
          </div>
          <p className="rd-stat-label">Today&apos;s orders</p>
          <p className="rd-stat-value">
            {ordersLoading ? "…" : stats.todayOrdersCount}
            <span className="rd-stat-meta">{stats.totalCount} total</span>
          </p>
        </div>

        <div className="rd-stat-card">
          <div className="rd-stat-top">
            <div className="rd-stat-icon rd-stat-icon-amber">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <p className="rd-stat-label">Today&apos;s revenue</p>
          <p className="rd-stat-value">
            {ordersLoading ? "…" : `$${stats.todayRevenue.toFixed(2)}`}
            <span className="rd-stat-meta">
              {stats.todayDeliveredCount} delivered today
            </span>
          </p>
        </div>

        <div className="rd-stat-card">
          <div className="rd-stat-top">
            <div className="rd-stat-icon rd-stat-icon-blue">
              <span className="material-symbols-outlined">timer</span>
            </div>
          </div>
          <p className="rd-stat-label">Active orders</p>
          <p className="rd-stat-value">
            {ordersLoading ? "…" : stats.activeCount}
            <span className="rd-stat-meta">In progress</span>
          </p>
        </div>
      </div>

      <div className="rd-content-grid">
        <div className="rd-panel">
          <div className="rd-panel-header">
            <h3 className="rd-panel-title">Recent orders</h3>
          </div>
          {ordersLoading ? (
            <p className="rd-empty">Loading orders…</p>
          ) : recentOrders.length === 0 ? (
            <p className="rd-empty">No orders yet.</p>
          ) : (
            <div className="rd-table-wrap">
              <table className="rd-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const avatar = avatarColor(order.customerId);
                    const primaryAction = restaurantPrimaryAction(order);
                    const statusHint = restaurantStatusHint(order.status);
                    return (
                      <tr key={order._id}>
                        <td className="rd-order-id">#{String(order._id).slice(-6)}</td>
                        <td>
                          <div className="rd-customer-cell">
                            <span
                              className="rd-avatar"
                              style={{ background: avatar.bg, color: avatar.text }}
                            >
                              {customerInitials(order.customerId)}
                            </span>
                            <span>{customerLabel(order.customerId)}</span>
                          </div>
                        </td>
                        <td className="rd-items-text">{formatItems(order.items)}</td>
                        <td>
                          <span className={statusBadgeClass(order.status)}>
                            {orderStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="rd-amount">${Number(order.totalAmount).toFixed(2)}</td>
                        <td>
                          <div className="rd-order-actions">
                            {primaryAction ? (
                              <button
                                type="button"
                                className="rd-action-btn rd-action-btn-primary"
                                disabled={orderActionId === order._id}
                                onClick={() =>
                                  handleOrderStatus(order._id, primaryAction.nextStatus)
                                }
                              >
                                {primaryAction.label}
                              </button>
                            ) : null}
                            {canRestaurantCancel(order) ? (
                              <button
                                type="button"
                                className="rd-action-btn"
                                disabled={orderActionId === order._id}
                                onClick={() => handleOrderStatus(order._id, "CANCELLED")}
                              >
                                Cancel
                              </button>
                            ) : null}
                            {!primaryAction && !canRestaurantCancel(order) && statusHint ? (
                              <span className={`rd-order-status-hint${order.status === "DELIVERED" ? " rd-order-status-hint-done" : ""}`}>
                                {statusHint}
                              </span>
                            ) : null}
                            {!primaryAction && !canRestaurantCancel(order) && !statusHint ? (
                              <span className="rd-items-text">—</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rd-side-panel">
          <div className="rd-info-card">
            <h3>Quick links</h3>
            <div className="rd-quick-links">
              <button
                type="button"
                className="rd-quick-link"
                onClick={() => navigate("/restaurant/menu")}
              >
                <span className="material-symbols-outlined">menu_book</span>
                Menu items
              </button>
              <button
                type="button"
                className="rd-quick-link"
                onClick={() => navigate("/restaurant/categories")}
              >
                <span className="material-symbols-outlined">category</span>
                Categories
              </button>
              <button
                type="button"
                className="rd-quick-link"
                onClick={() => navigate("/restaurant/settings")}
              >
                <span className="material-symbols-outlined">settings</span>
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RestaurantDashboard;
