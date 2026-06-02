import { useEffect, useMemo, useState } from "react";
import { getRestaurantOrders, updateOrderStatus } from "../api/orders";
import { connectSocket } from "../socket";
import RestaurantLayout from "../components/restaurant/RestaurantLayout";

const PAGE_SIZE = 10;

const FILTER_CHIPS = [
  { id: "all", label: "All Orders" },
  { id: "PREPARING", label: "Preparing" },
  { id: "ACCEPTED", label: "Ready for Pickup" },
  { id: "PICKED_UP", label: "Out for Delivery" },
  { id: "DELIVERED", label: "Completed" },
];

const AVATAR_COLORS = [
  { bg: "#adedd3", text: "#306d58" },
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#f3e8ff", text: "#7c3aed" },
  { bg: "#ffedd5", text: "#c2410c" },
];

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

function orderShortId(orderId) {
  return `#FD-${String(orderId).slice(-4).toUpperCase()}`;
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

function itemCount(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusDisplayLabel(status) {
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

function statusBadgeClass(status) {
  const key = (status || "").toLowerCase();
  return `rd-oh-badge rd-oh-badge-${key}`;
}

function matchesSearch(order, query) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const id = String(order._id).toLowerCase();
  const shortId = orderShortId(order._id).toLowerCase();
  const customer = customerLabel(order.customerId).toLowerCase();
  return id.includes(q) || shortId.includes(q) || customer.includes(q);
}

function RestaurantOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [orderActionId, setOrderActionId] = useState(null);

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
          if (sorted.length > 0 && !selectedId) {
            setSelectedId(String(sorted[0]._id));
          }
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
              ? { ...o, status: payload.status, updatedAt: payload.updatedAt }
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
      return matchesSearch(o, search);
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

  const selectedOrder = useMemo(
    () => orders.find((o) => String(o._id) === String(selectedId)) || null,
    [orders, selectedId]
  );

  const todayStats = useMemo(() => {
    const todayOrders = orders.filter((o) => isToday(o.createdAt));
    const revenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    return { count: todayOrders.length, revenue };
  }, [orders]);

  const handleOrderStatus = async (orderId, nextStatus) => {
    setOrderActionId(orderId);
    setOrdersError("");
    try {
      const { order } = await updateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(orderId) ? { ...o, ...order } : o))
      );
    } catch (e) {
      setOrdersError(e.message || "Order update failed");
    } finally {
      setOrderActionId(null);
    }
  };

  const primaryAction = (order) => {
    if (!order) return null;
    if (order.status === "PLACED") {
      return { label: "Accept Order", status: "ACCEPTED", variant: "primary" };
    }
    if (order.status === "ACCEPTED") {
      return { label: "Start Cooking", status: "PREPARING", variant: "primary" };
    }
    return null;
  };

  const canReject = (order) =>
    order && ["PLACED", "ACCEPTED", "PREPARING"].includes(order.status);

  const rangeStart = filteredOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredOrders.length);

  return (
    <RestaurantLayout>
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

      <div className="rd-oh-grid">
        <div className="rd-oh-main-col">
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
                          const isSelected = String(order._id) === String(selectedId);
                          return (
                            <tr
                              key={order._id}
                              className={isSelected ? "rd-oh-row-selected" : ""}
                              onClick={() => setSelectedId(String(order._id))}
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

        <aside className="rd-oh-detail-panel">
          {selectedOrder ? (
            <>
              <div className="rd-oh-detail-head">
                <div className="rd-oh-detail-head-top">
                  <span className="rd-oh-detail-tag">
                    {["PLACED", "ACCEPTED", "PREPARING"].includes(selectedOrder.status)
                      ? "Active Order"
                      : "Order Details"}
                  </span>
                  <span className="rd-oh-detail-time">
                    Received: {formatTime(selectedOrder.createdAt)}
                  </span>
                </div>
                <h3 className="rd-oh-detail-title">{orderShortId(selectedOrder._id)}</h3>
                <div className="rd-oh-detail-customer">
                  <span className="material-symbols-outlined">person</span>
                  {customerLabel(selectedOrder.customerId)}
                </div>
              </div>

              <div className="rd-oh-detail-body">
                <section>
                  <h4 className="rd-oh-section-label">Order Items</h4>
                  <ul className="rd-oh-items-list">
                    {(selectedOrder.items || []).map((line, idx) => (
                      <li key={`${line.menuItemId}-${idx}`} className="rd-oh-item-row">
                        <div className="rd-oh-item-thumb">
                          <span className="material-symbols-outlined">lunch_dining</span>
                        </div>
                        <div className="rd-oh-item-info">
                          <div className="rd-oh-item-line">
                            <p>
                              {line.quantity}x {line.name}
                            </p>
                            <p>${(Number(line.price) * Number(line.quantity)).toFixed(2)}</p>
                          </div>
                          <p className="rd-oh-item-unit">
                            ${Number(line.price).toFixed(2)} each
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rd-oh-instructions">
                  <div className="rd-oh-instructions-head">
                    <span className="material-symbols-outlined">description</span>
                    <h4>Special Instructions</h4>
                  </div>
                  <p className="rd-oh-instructions-text">
                    No special instructions were provided for this order.
                  </p>
                </section>

                <section>
                  <h4 className="rd-oh-section-label">Delivery Details</h4>
                  <p className="rd-oh-delivery-note">
                    Delivery address is not stored on this order. Customer contact is shown
                    above.
                  </p>
                </section>
              </div>

              <div className="rd-oh-detail-footer">
                <div className="rd-oh-total-row">
                  <span>Total Payment</span>
                  <span className="rd-oh-total-value">
                    ${Number(selectedOrder.totalAmount).toFixed(2)}
                  </span>
                </div>
                {primaryAction(selectedOrder) || canReject(selectedOrder) ? (
                  <div
                    className={`rd-oh-action-grid ${
                      primaryAction(selectedOrder) && canReject(selectedOrder)
                        ? ""
                        : "rd-oh-action-grid--single"
                    }`}
                  >
                    {canReject(selectedOrder) ? (
                      <button
                        type="button"
                        className="rd-oh-btn-reject"
                        disabled={orderActionId === selectedOrder._id}
                        onClick={() => handleOrderStatus(selectedOrder._id, "CANCELLED")}
                      >
                        Reject Order
                      </button>
                    ) : null}
                    {primaryAction(selectedOrder) ? (
                      <button
                        type="button"
                        className="rd-oh-btn-primary"
                        disabled={orderActionId === selectedOrder._id}
                        onClick={() =>
                          handleOrderStatus(
                            selectedOrder._id,
                            primaryAction(selectedOrder).status
                          )
                        }
                      >
                        {primaryAction(selectedOrder).label}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="rd-oh-status-only">
                    <span className={statusBadgeClass(selectedOrder.status)}>
                      {statusDisplayLabel(selectedOrder.status)}
                    </span>
                  </div>
                )}
                <button type="button" className="rd-oh-print-btn" disabled>
                  <span className="material-symbols-outlined">print</span>
                  Print Kitchen Ticket
                </button>
              </div>
            </>
          ) : (
            <div className="rd-oh-detail-empty">
              <span className="material-symbols-outlined">receipt_long</span>
              <p>Select an order to view details</p>
            </div>
          )}
        </aside>
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
    </RestaurantLayout>
  );
}

export default RestaurantOrderHistory;
