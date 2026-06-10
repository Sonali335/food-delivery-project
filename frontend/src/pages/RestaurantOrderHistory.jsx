import { useEffect, useMemo, useState } from "react";
import { getRestaurantOrders, updateOrderStatus } from "../api/orders";
import { acceptRestaurantOrder } from "../utils/acceptRestaurantOrder";
import { connectSocket } from "../socket";
import RestaurantOrderDetailModal from "../components/restaurant/RestaurantOrderDetailModal";
import {
  avatarColor,
  canRejectOrder,
  customerInitials,
  customerLabel,
  itemCount,
  matchesOrderSearch,
  orderShortId,
  primaryOrderAction,
  statusBadgeClass,
  statusDisplayLabel,
} from "../utils/restaurantOrderDisplay";
import {
  computeRestaurantDashboardStats,
  mergeOrderRecord,
} from "../utils/restaurantDashboardStats";

const PAGE_SIZE = 10;

const FILTER_CHIPS = [
  { id: "all", label: "All orders" },
  { id: "PLACED", label: "New" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "PREPARING", label: "Preparing" },
  { id: "PICKED_UP", label: "Out for delivery" },
  { id: "DELIVERED", label: "Delivered" },
];

function RestaurantOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [orderActionId, setOrderActionId] = useState(null);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      setOrdersError("");
      try {
        const { orders: list } = await getRestaurantOrders();
        if (!cancelled) {
          const sorted = [...(list || [])].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sorted);
        }
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
              ? {
                  ...o,
                  status: payload.status,
                  updatedAt: payload.updatedAt,
                  eta: payload.eta ?? o.eta,
                  prepTimeMinutes: payload.prepTimeMinutes ?? o.prepTimeMinutes,
                }
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

  const counts = useMemo(() => {
    const base = { all: orders.length };
    FILTER_CHIPS.forEach((chip) => {
      if (chip.id !== "all") {
        base[chip.id] = orders.filter((o) => o.status === chip.id).length;
      }
    });
    return base;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      return matchesOrderSearch(o, search);
    });
  }, [orders, filter, search]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageOrders = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const detailOrder = useMemo(
    () => orders.find((o) => String(o._id) === String(detailOrderId)) || null,
    [orders, detailOrderId]
  );

  const todayStats = useMemo(() => {
    const stats = computeRestaurantDashboardStats(orders);
    return {
      count: stats.todayOrdersCount,
      revenue: stats.todayRevenue,
      delivered: stats.todayDeliveredCount,
    };
  }, [orders]);

  const handleOrderStatus = async (orderId, nextStatus) => {
    setOrderActionId(orderId);
    setModalError("");
    setOrdersError("");
    try {
      const order = orders.find((o) => String(o._id) === String(orderId));
      const result =
        nextStatus === "ACCEPTED"
          ? await acceptRestaurantOrder(orderId, order?.items)
          : await updateOrderStatus(orderId, nextStatus);
      const { order } = result;
      setOrders((prev) => mergeOrderRecord(prev, order));
      const { orders: list } = await getRestaurantOrders();
      setOrders(list || []);
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

  const openDetail = (orderId) => {
    setModalError("");
    setDetailOrderId(String(orderId));
  };

  const rangeStart = filteredOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredOrders.length);

  return (
    <>
      <header className="rd-oh-header">
        <div>
          <h1 className="rd-page-title">Order History</h1>
          <p className="rd-page-subtitle">
            Manage your active and completed restaurant orders.
          </p>
        </div>
        <div className="rd-oh-header-actions">
          <div className="rd-oh-search-wrap">
            <span className="material-symbols-outlined rd-oh-search-icon">search</span>
            <input
              type="search"
              className="rd-oh-search"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search orders"
            />
          </div>
          <button type="button" className="rd-btn-outline rd-oh-filter-btn" disabled>
            <span className="material-symbols-outlined">filter_list</span>
            More Filters
          </button>
        </div>
      </header>

      {ordersError ? <div className="rd-alert-error">{ordersError}</div> : null}

      <div className="rd-oh-layout-full">
        <div className="rd-oh-chips">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`rd-oh-chip ${filter === chip.id ? "rd-oh-chip-active" : ""}`}
              onClick={() => setFilter(chip.id)}
            >
              {chip.label} ({counts[chip.id] ?? 0})
            </button>
          ))}
        </div>

        <div className="rd-oh-table-panel">
          {ordersLoading ? (
            <p className="rd-empty">Loading orders…</p>
          ) : (
            <>
              <div className="rd-oh-table-scroll">
                <table className="rd-oh-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th aria-label="View" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="rd-oh-table-empty">
                          No orders match your filters.
                        </td>
                      </tr>
                    ) : (
                      pageOrders.map((order) => {
                        const avatar = avatarColor(order.customerId);
                        const count = itemCount(order.items);
                        return (
                          <tr
                            key={order._id}
                            className="rd-oh-row-clickable"
                            onClick={() => openDetail(order._id)}
                          >
                            <td className="rd-oh-order-id">{orderShortId(order._id)}</td>
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
                            <td>
                              {count} {count === 1 ? "Item" : "Items"}
                            </td>
                            <td className="rd-amount">
                              ${Number(order.totalAmount).toFixed(2)}
                            </td>
                            <td>
                              <span className={statusBadgeClass(order.status)}>
                                {statusDisplayLabel(order.status)}
                              </span>
                            </td>
                            <td>
                              <span className="material-symbols-outlined rd-oh-chevron">
                                chevron_right
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="rd-oh-pagination">
                <p className="rd-oh-pagination-text">
                  Showing {rangeStart}-{rangeEnd} of {filteredOrders.length} orders
                </p>
                <div className="rd-oh-pagination-btns">
                  <button
                    type="button"
                    className="rd-oh-page-btn"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (safePage <= 3) pageNum = i + 1;
                      else if (safePage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = safePage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`rd-oh-page-btn ${safePage === pageNum ? "rd-oh-page-btn-active" : ""}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="rd-oh-page-btn"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rd-oh-floating-stats">
        <div className="rd-oh-stats-bar">
          <div className="rd-oh-stat-item">
            <span className="rd-oh-stat-dot" />
            <span>
              Today: <strong>{ordersLoading ? "…" : todayStats.count} orders</strong>
            </span>
          </div>
          <span className="rd-oh-stat-divider" />
          <div className="rd-oh-stat-item">
            <span className="material-symbols-outlined rd-oh-stat-icon-amber">payments</span>
            <span>
              Revenue: <strong>${todayStats.revenue.toFixed(2)}</strong>
            </span>
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

export default RestaurantOrderHistory;
