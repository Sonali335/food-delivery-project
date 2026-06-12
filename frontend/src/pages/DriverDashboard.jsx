import { useEffect, useMemo, useState } from "react";
import { updateLocation } from "../api/driver";
import { getDriverOrders, updateOrderStatus } from "../api/orders";
import { connectSocket } from "../socket";
import { orderStatusLabel } from "../utils/orderStatus";
import OrderEtaText from "../components/OrderEtaText";
import DriverLayout from "../components/driver/DriverLayout";
import { useDriverProfile } from "../components/driver/DriverProfileContext";
import useDriverAutoLocation from "../hooks/useDriverAutoLocation";

const ACTIVE_STATUSES = ["PREPARING", "PICKED_UP"];

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "Delivery";
  const first = items[0]?.name || "Order";
  if (items.length === 1) return first;
  return `${first} +${items.length - 1} more`;
}

function orderShortId(orderId) {
  return `#FD-${String(orderId).slice(-4).toUpperCase()}`;
}

function statusBadgeClass(status) {
  const key = (status || "").toLowerCase();
  if (key === "preparing") return "dd-badge-status dd-badge-preparing";
  if (key === "picked_up") return "dd-badge-status dd-badge-picked_up";
  if (key === "delivered") return "dd-badge-success";
  return "dd-badge-status";
}

function statusLabel(status) {
  return orderStatusLabel(status);
}

function computeStats(orders, ratingAverage) {
  const todayDelivered = orders.filter((o) => o.status === "DELIVERED" && isToday(o.updatedAt));
  const completedToday = todayDelivered.length;

  let avgMinutes = null;
  const deliveredWithTimes = todayDelivered.filter((o) => o.createdAt && o.updatedAt);
  if (deliveredWithTimes.length > 0) {
    const totalMs = deliveredWithTimes.reduce(
      (sum, o) => sum + (new Date(o.updatedAt) - new Date(o.createdAt)),
      0
    );
    avgMinutes = Math.round(totalMs / deliveredWithTimes.length / 60000);
  }

  return {
    completedToday,
    rating: ratingAverage != null ? Number(ratingAverage).toFixed(2) : "—",
    avgDelivery: avgMinutes != null ? `${avgMinutes} min` : "—",
    activeCount: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
  };
}

function DriverDashboardContent() {
  useDriverAutoLocation();
  const { driverName, isOnline, ratingAverage } = useDriverProfile();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locationSuccess, setLocationSuccess] = useState("");
  const [locationError, setLocationError] = useState("");
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderActionId, setOrderActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      setOrdersError("");
      try {
        const { orders: list } = await getDriverOrders();
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
      setOrders((prev) => {
        const idx = prev.findIndex((o) => String(o._id) === payload.orderId);
        if (idx >= 0) {
          return prev.map((o) =>
            String(o._id) === payload.orderId
              ? { ...o, status: payload.status, updatedAt: payload.updatedAt, eta: payload.eta ?? o.eta }
              : o
          );
        }
        loadOrders();
        return prev;
      });
    };

    socket.on("order:update", onOrderUpdate);

    return () => {
      cancelled = true;
      socket.off("order:update", onOrderUpdate);
    };
  }, []);

  const activeOrder = useMemo(
    () => orders.find((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders]
  );

  const todayHistory = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "DELIVERED" && isToday(o.updatedAt || o.createdAt)
      ),
    [orders]
  );

  const pendingDeliveries = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders]
  );

  const stats = useMemo(() => computeStats(orders, ratingAverage), [orders, ratingAverage]);

  const handleOrderStatus = async (orderId, status) => {
    setOrderActionId(orderId);
    setOrdersError("");
    try {
      await updateOrderStatus(orderId, status);
    } catch (e) {
      setOrdersError(e.message || "Order update failed");
    } finally {
      setOrderActionId(null);
    }
  };

  const handleActiveOrderAction = () => {
    if (!activeOrder) return;
    if (activeOrder.status === "PREPARING") {
      handleOrderStatus(activeOrder._id, "PICKED_UP");
      return;
    }
    if (activeOrder.status === "PICKED_UP") {
      handleOrderStatus(activeOrder._id, "DELIVERED");
    }
  };

  const handleUpdateLocation = async () => {
    setLocationSuccess("");
    setLocationError("");
    setUpdatingLocation(true);
    try {
      await updateLocation(Number(lat), Number(lng));
      setLocationSuccess("Location updated successfully.");
    } catch (e) {
      setLocationError(e.message || "Failed to update location");
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      () => setLocationError("Could not get your current location.")
    );
  };

  const activeActionLabel =
    activeOrder?.status === "PREPARING"
      ? "Navigate to Pick-up"
      : activeOrder?.status === "PICKED_UP"
        ? "Mark as Delivered"
        : "";

  return (
    <>
      <div className="dd-page-header">
        <h1 className="dd-page-title">Welcome back, {driverName}</h1>
        <p className="dd-page-subtitle">
          Your current status is set to{" "}
          <span className={isOnline ? "dd-status-online" : "dd-status-offline"}>
            {isOnline ? "Online" : "Offline"}
          </span>
          . {isOnline ? "Ready for new orders." : "Go online to receive deliveries."}
        </p>
      </div>

      {ordersError ? <div className="dd-alert-error">{ordersError}</div> : null}
      {locationSuccess ? <div className="dd-alert-success">{locationSuccess}</div> : null}
      {locationError ? <div className="dd-alert-error">{locationError}</div> : null}

      <div className="dd-bento-grid">
        {activeOrder ? (
          <article className="dd-active-card">
            <div className="dd-active-card-image">
              <div className="dd-active-card-image-overlay" />
              <span className="dd-active-badge">Active Now</span>
            </div>
            <div className="dd-active-card-body">
              <div>
                <div className="dd-active-card-top">
                  <div>
                    <h3 className="dd-active-card-title">
                      {activeOrder.status === "PREPARING" ? "Pick-up" : "Deliver"}:{" "}
                      {formatItems(activeOrder.items)}
                    </h3>
                    <p className="dd-active-card-meta">
                      {orderShortId(activeOrder._id)} • {statusLabel(activeOrder.status)}
                    </p>
                    <OrderEtaText eta={activeOrder.eta} />
                  </div>
                  <div>
                    <p className="dd-active-earning">${Number(activeOrder.totalAmount).toFixed(2)}</p>
                    <p className="dd-active-earning-label">Order total</p>
                  </div>
                </div>
                <div className="dd-active-details">
                  <div className="dd-active-detail-row">
                    <span className="material-symbols-outlined">restaurant</span>
                    <span>Restaurant {String(activeOrder.restaurantId).slice(-6)}</span>
                  </div>
                  <div className="dd-active-detail-row">
                    <span className="material-symbols-outlined">schedule</span>
                    <span>Ordered at {formatTime(activeOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="dd-btn-primary"
                disabled={orderActionId === activeOrder._id}
                onClick={handleActiveOrderAction}
              >
                {orderActionId === activeOrder._id ? "Updating…" : activeActionLabel}
                <span className="material-symbols-outlined">directions_car</span>
              </button>
            </div>
          </article>
        ) : (
          <article className="dd-active-card">
            <div className="dd-empty-card" style={{ flex: 1, border: "none", boxShadow: "none" }}>
              {ordersLoading ? "Loading deliveries…" : "No active delivery right now."}
            </div>
          </article>
        )}

        <aside className="dd-earnings-card" id="earnings">
          <div>
            <div className="dd-earnings-header">
              <span className="dd-earnings-label">Today&apos;s Earnings</span>
              <span
                className="material-symbols-outlined"
                style={{ color: "#10b981", fontVariationSettings: "'FILL' 1" }}
              >
                payments
              </span>
            </div>
            <h2 className="dd-earnings-value">$0.00</h2>
            <p className="dd-earnings-change">Earnings tracking coming soon</p>
          </div>
          <div className="dd-earnings-footer">
            <div className="dd-earnings-row">
              <span className="dd-earnings-row-label">Tips</span>
              <span className="dd-earnings-row-value">$0.00</span>
            </div>
            <div className="dd-earnings-row">
              <span className="dd-earnings-row-label">Completed today</span>
              <span className="dd-earnings-row-value">{stats.completedToday}</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="dd-stats-row">
        <div className="dd-stat-card">
          <span className="material-symbols-outlined">task_alt</span>
          <h4 className="dd-stat-value">{ordersLoading ? "…" : stats.completedToday}</h4>
          <p className="dd-stat-label">Completed</p>
        </div>
        <div className="dd-stat-card">
          <span className="material-symbols-outlined">star</span>
          <h4 className="dd-stat-value">{stats.rating}</h4>
          <p className="dd-stat-label">Rating</p>
        </div>
        <div className="dd-stat-card">
          <span className="material-symbols-outlined">avg_pace</span>
          <h4 className="dd-stat-value">{ordersLoading ? "…" : stats.avgDelivery}</h4>
          <p className="dd-stat-label">Avg. Delivery</p>
        </div>
        <div className="dd-stat-card">
          <span className="material-symbols-outlined">local_shipping</span>
          <h4 className="dd-stat-value">{ordersLoading ? "…" : stats.activeCount}</h4>
          <p className="dd-stat-label">Active</p>
        </div>
      </div>

      <div className="dd-content-grid">
        <section id="deliveries">
          <div className="dd-section-header">
            <h2 className="dd-section-title">Today&apos;s History</h2>
          </div>
          {ordersLoading ? (
            <p className="dd-empty-card">Loading orders…</p>
          ) : todayHistory.length === 0 && pendingDeliveries.length === 0 ? (
            <p className="dd-empty-card">No deliveries yet.</p>
          ) : (
            <div className="dd-delivery-list">
              {pendingDeliveries.map((order) => (
                <article key={order._id} className="dd-delivery-item">
                  <div className="dd-delivery-item-left">
                    <div className="dd-delivery-avatar">{String(order._id).slice(-2).toUpperCase()}</div>
                    <div>
                      <p className="dd-delivery-name">{formatItems(order.items)}</p>
                      <p className="dd-delivery-meta">
                        {orderShortId(order._id)} • {statusLabel(order.status)}
                      </p>
                      <OrderEtaText eta={order.eta} />
                      <div className="dd-delivery-actions">
                        {order.status === "PREPARING" ? (
                          <button
                            type="button"
                            className="dd-action-btn"
                            disabled={orderActionId === order._id}
                            onClick={() => handleOrderStatus(order._id, "PICKED_UP")}
                          >
                            Pick up
                          </button>
                        ) : null}
                        {order.status === "PICKED_UP" ? (
                          <button
                            type="button"
                            className="dd-action-btn"
                            disabled={orderActionId === order._id}
                            onClick={() => handleOrderStatus(order._id, "DELIVERED")}
                          >
                            Mark delivered
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="dd-delivery-right">
                    <p className="dd-delivery-amount">${Number(order.totalAmount).toFixed(2)}</p>
                    <span className={statusBadgeClass(order.status)}>{statusLabel(order.status)}</span>
                  </div>
                </article>
              ))}
              {todayHistory.map((order) => (
                <article key={order._id} className="dd-delivery-item">
                  <div className="dd-delivery-item-left">
                    <div className="dd-delivery-avatar">{String(order._id).slice(-2).toUpperCase()}</div>
                    <div>
                      <p className="dd-delivery-name">{formatItems(order.items)}</p>
                      <p className="dd-delivery-meta">
                        Delivered • {formatTime(order.updatedAt || order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="dd-delivery-right">
                    <p className="dd-delivery-amount">${Number(order.totalAmount).toFixed(2)}</p>
                    <span className="dd-badge-success">Success</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="dd-panel">
          <div className="dd-panel-header">
            <h3 className="dd-panel-title">Update location</h3>
          </div>
          <div className="dd-panel-body">
            <div className="dd-form-row">
              <div className="dd-form-field">
                <label htmlFor="driver-lat">Latitude</label>
                <input
                  id="driver-lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </div>
              <div className="dd-form-field">
                <label htmlFor="driver-lng">Longitude</label>
                <input
                  id="driver-lng"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </div>
            </div>
            <div className="dd-form-actions">
              <button
                type="button"
                className="dd-btn-outline"
                onClick={handleUseCurrentLocation}
                disabled={updatingLocation}
              >
                <span className="material-symbols-outlined">my_location</span>
                Use current location
              </button>
              <button
                type="button"
                className="dd-btn-primary"
                style={{ width: "auto" }}
                onClick={handleUpdateLocation}
                disabled={updatingLocation}
              >
                {updatingLocation ? "Updating…" : "Update location"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function DriverDashboard() {
  return (
    <DriverLayout>
      <DriverDashboardContent />
    </DriverLayout>
  );
}

export default DriverDashboard;
