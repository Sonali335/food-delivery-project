import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRestaurantOrders, updateOrderStatus } from "../api/orders";
import { acceptRestaurantOrder } from "../utils/acceptRestaurantOrder";
import OrderEtaText from "../components/OrderEtaText";
import { connectSocket } from "../socket";
import { useRestaurantProfile } from "../components/restaurant/RestaurantProfileContext";
import {
  computeRestaurantDashboardStats,
  mergeOrderPatch,
  mergeOrderRecord,
} from "../utils/restaurantDashboardStats";
import {
  avatarColor as orderAvatarColor,
  customerInitials as orderCustomerInitials,
  customerLabel as orderCustomerLabel,
  itemCount,
  orderShortId,
} from "../utils/restaurantOrderDisplay";
import RestaurantNewOrdersAlert from "../components/restaurant/RestaurantNewOrdersAlert";
import RestaurantOrderDetailModal from "../components/restaurant/RestaurantOrderDetailModal";
import RestaurantOrderStatusSelect from "../components/restaurant/RestaurantOrderStatusSelect";

function formatItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items.map((line) => `${line.quantity}x ${line.name}`).join(", ");
}

function RestaurantDashboard() {
  const navigate = useNavigate();
  const { restaurantName } = useRestaurantProfile();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderActionId, setOrderActionId] = useState(null);
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [modalError, setModalError] = useState("");

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
          eta: payload.eta ?? undefined,
          prepTimeMinutes: payload.prepTimeMinutes ?? undefined,
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
  const newOrders = useMemo(
    () => orders.filter((o) => o.status === "PLACED" || o.status === "NEW"),
    [orders]
  );
  const recentOrders = useMemo(
    () => orders.filter((o) => o.status !== "PLACED" && o.status !== "NEW").slice(0, 10),
    [orders]
  );

  const detailOrder = useMemo(
    () => orders.find((o) => String(o._id) === String(detailOrderId)) || null,
    [orders, detailOrderId]
  );

  const openDetail = (orderId) => {
    setModalError("");
    setDetailOrderId(String(orderId));
  };

  const handleOrderStatus = async (orderId, nextStatus) => {
    setOrderActionId(orderId);
    setModalError("");
    setOrdersError("");
    try {
      const existingOrder = orders.find((o) => String(o._id) === String(orderId));
      const result =
        nextStatus === "ACCEPTED"
          ? await acceptRestaurantOrder(orderId, existingOrder?.items)
          : await updateOrderStatus(orderId, nextStatus);
      const { order: updatedOrder } = result;
      setOrders((prev) => mergeOrderRecord(prev, updatedOrder));
      await refreshOrders();
      if (nextStatus === "CANCELLED" || nextStatus === "DELIVERED") {
        setDetailOrderId(null);
      }
    } catch (e) {
      const msg = e.message || "Order update failed";
      setModalError(msg);
      setOrdersError(msg);
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

      {!ordersLoading ? (
        <RestaurantNewOrdersAlert
          orders={newOrders}
          orderActionId={orderActionId}
          onAccept={(id) => handleOrderStatus(id, "ACCEPTED")}
          onCancel={(id) => handleOrderStatus(id, "CANCELLED")}
          formatItems={formatItems}
          customerLabel={orderCustomerLabel}
          customerInitials={orderCustomerInitials}
          avatarColor={orderAvatarColor}
        />
      ) : null}

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
            <button
              type="button"
              className="rd-btn-outline rd-panel-header-link"
              onClick={() => navigate("/restaurant/orders")}
            >
              View all
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          {ordersLoading ? (
            <p className="rd-empty">Loading orders…</p>
          ) : recentOrders.length === 0 ? (
            <p className="rd-empty">
              {newOrders.length > 0
                ? "No accepted orders yet. Accept a new order above to see it here."
                : "No orders yet."}
            </p>
          ) : (
            <div className="rd-oh-table-panel rd-dashboard-recent-table">
              <div className="rd-oh-table-scroll">
                <table className="rd-oh-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const avatar = orderAvatarColor(order.customerId);
                      const count = itemCount(order.items);
                      const isSelected = String(detailOrderId) === String(order._id);
                      return (
                        <tr
                          key={order._id}
                          className={
                            isSelected
                              ? "rd-oh-row-clickable rd-oh-row-selected"
                              : "rd-oh-row-clickable"
                          }
                          onClick={() => openDetail(order._id)}
                        >
                          <td className="rd-oh-order-id">
                            <button
                              type="button"
                              className="rd-oh-order-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(order._id);
                              }}
                            >
                              {orderShortId(order._id)}
                            </button>
                          </td>
                          <td>
                            <div className="rd-customer-cell">
                              <span
                                className="rd-avatar"
                                style={{ background: avatar.bg, color: avatar.text }}
                              >
                                {orderCustomerInitials(order.customerId)}
                              </span>
                              <span>{orderCustomerLabel(order.customerId)}</span>
                            </div>
                          </td>
                          <td>
                            {count} {count === 1 ? "Item" : "Items"}
                          </td>
                          <td className="rd-amount">
                            ${Number(order.totalAmount).toFixed(2)}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <RestaurantOrderStatusSelect
                              orderId={order._id}
                              status={order.status}
                              disabled={orderActionId === order._id}
                              onStatusChange={handleOrderStatus}
                            />
                            <OrderEtaText eta={order.eta} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

      {detailOrder ? (
        <RestaurantOrderDetailModal
          order={detailOrder}
          onClose={() => {
            setDetailOrderId(null);
            setModalError("");
          }}
          onReject={(id) => handleOrderStatus(id, "CANCELLED")}
          onPrimaryAction={(id, status) => handleOrderStatus(id, status)}
          actionLoading={orderActionId === detailOrder._id}
          actionError={modalError}
        />
      ) : null}
    </>
  );
}

export default RestaurantDashboard;
