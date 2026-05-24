import DriverLayout from "../components/driver/DriverLayout";

const STATS = [
  {
    label: "Total Deliveries",
    value: "1,284",
    trendIcon: "trending_up",
    trendText: "+12% from last month",
    trendClass: "dd-hist-stat-trend-green",
  },
  {
    label: "Completion Rate",
    value: "99.2%",
    trendIcon: "check_circle",
    trendText: "Excellent Performance",
    trendClass: "dd-hist-stat-trend-green",
  },
  {
    label: "Total Earnings",
    value: "$12,450",
    trendIcon: "payments",
    trendText: "Top 5% in Region",
    trendClass: "dd-hist-stat-trend-green",
  },
  {
    label: "Avg. Rating",
    value: "4.92",
    trendIcon: "star",
    trendText: "1.2k Reviews",
    trendClass: "dd-hist-stat-trend-amber",
    trendFill: true,
  },
];

const ORDERS = [
  {
    id: "#ORD-98231",
    items: "Gourmet Burger & Fries",
    date: "Oct 24, 2023",
    time: "07:45 PM",
    customer: "John Doe",
    initials: "JD",
    avatarClass: "dd-hist-avatar-emerald",
    distance: "4.2 miles",
    duration: "18 mins",
    earnings: "$18.50",
  },
  {
    id: "#ORD-98194",
    items: "Sushi Platter (24 pcs)",
    date: "Oct 24, 2023",
    time: "06:12 PM",
    customer: "Sarah Adams",
    initials: "SA",
    avatarClass: "dd-hist-avatar-blue",
    distance: "2.1 miles",
    duration: "12 mins",
    earnings: "$12.00",
  },
  {
    id: "#ORD-98002",
    items: "Garden Pizza x2",
    date: "Oct 23, 2023",
    time: "09:30 PM",
    customer: "Mike Thompson",
    initials: "MT",
    avatarClass: "dd-hist-avatar-purple",
    distance: "6.8 miles",
    duration: "25 mins",
    earnings: "$24.30",
  },
  {
    id: "#ORD-97881",
    items: "Pad Thai (Extra Spicy)",
    date: "Oct 23, 2023",
    time: "01:15 PM",
    customer: "Rachel Lee",
    initials: "RL",
    avatarClass: "dd-hist-avatar-orange",
    distance: "1.2 miles",
    duration: "8 mins",
    earnings: "$9.75",
  },
];

const WEEKLY_BARS = [
  { label: "Mon", height: "40%" },
  { label: "Tue", height: "65%" },
  { label: "Wed", height: "55%" },
  { label: "Thu", height: "95%", highlight: true },
  { label: "Fri", height: "75%" },
  { label: "Sat", height: "45%" },
  { label: "Sun", height: "30%" },
];

function DriverOrderHistory() {
  return (
    <DriverLayout>
      <header className="dd-hist-header">
        <div>
          <h1 className="dd-page-title">Delivery History</h1>
          <p className="dd-page-subtitle">
            Review and manage your past delivery completions and earnings.
          </p>
        </div>
        <div className="dd-hist-header-actions">
          <button type="button" className="dd-hist-btn-outline">
            <span className="material-symbols-outlined">calendar_today</span>
            Last 30 Days
          </button>
          <button type="button" className="dd-hist-btn-primary">
            <span className="material-symbols-outlined">download</span>
            Export CSV
          </button>
        </div>
      </header>

      <section className="dd-hist-stats">
        {STATS.map((stat) => (
          <div key={stat.label} className="dd-hist-stat-card">
            <p className="dd-hist-stat-label">{stat.label}</p>
            <h3 className="dd-hist-stat-value">{stat.value}</h3>
            <div className={`dd-hist-stat-trend ${stat.trendClass}`}>
              <span
                className="material-symbols-outlined"
                style={stat.trendFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {stat.trendIcon}
              </span>
              <span>{stat.trendText}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="dd-hist-panel">
        <div className="dd-hist-panel-header">
          <h2 className="dd-hist-section-title">Activity Log</h2>
          <div className="dd-hist-panel-tools">
            <div className="dd-hist-search-wrap">
              <span className="material-symbols-outlined dd-hist-search-icon">search</span>
              <input
                className="dd-hist-search"
                type="text"
                placeholder="Search order ID or customer"
                readOnly
              />
            </div>
            <button type="button" className="dd-hist-icon-btn" aria-label="Filter">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        <div className="dd-hist-table-wrap">
          <table className="dd-hist-table">
            <thead>
              <tr>
                <th>Order Details</th>
                <th>Date &amp; Time</th>
                <th>Customer</th>
                <th>Distance</th>
                <th>Earnings</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((order) => (
                <tr key={order.id}>
                  <td>
                    <p className="dd-hist-cell-primary">{order.id}</p>
                    <p className="dd-hist-cell-muted">{order.items}</p>
                  </td>
                  <td>
                    <p className="dd-hist-cell-primary">{order.date}</p>
                    <p className="dd-hist-cell-muted">{order.time}</p>
                  </td>
                  <td>
                    <div className="dd-hist-customer">
                      <span className={`dd-hist-avatar ${order.avatarClass}`}>{order.initials}</span>
                      <p className="dd-hist-cell-primary">{order.customer}</p>
                    </div>
                  </td>
                  <td>
                    <p className="dd-hist-cell-primary">{order.distance}</p>
                    <p className="dd-hist-cell-muted">{order.duration}</p>
                  </td>
                  <td>
                    <p className="dd-hist-earnings">{order.earnings}</p>
                  </td>
                  <td>
                    <span className="dd-hist-badge-completed">Completed</span>
                  </td>
                  <td className="dd-hist-td-actions">
                    <button type="button" className="dd-hist-more-btn" aria-label="More options">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dd-hist-panel-footer">
          <p className="dd-hist-footer-text">Showing 1-10 of 1,284 deliveries</p>
          <div className="dd-hist-pagination">
            <button type="button" className="dd-hist-page-nav" disabled aria-label="Previous page">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button type="button" className="dd-hist-page-num dd-hist-page-num-active">
              1
            </button>
            <button type="button" className="dd-hist-page-num">
              2
            </button>
            <button type="button" className="dd-hist-page-num">
              3
            </button>
            <button type="button" className="dd-hist-page-nav" aria-label="Next page">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      <section className="dd-hist-bottom-grid">
        <div className="dd-hist-performance-card">
          <div className="dd-hist-performance-header">
            <h3 className="dd-hist-section-title">Weekly Performance</h3>
            <div className="dd-hist-legend">
              <span className="dd-hist-legend-dot" />
              <span className="dd-hist-legend-label">Deliveries</span>
            </div>
          </div>
          <div className="dd-hist-weekly-chart">
            {WEEKLY_BARS.map((bar) => (
              <div key={bar.label} className="dd-hist-weekly-col">
                <div
                  className={`dd-hist-weekly-bar ${bar.highlight ? "dd-hist-weekly-bar-highlight" : ""}`}
                  style={{ height: bar.height }}
                />
                <span className={bar.highlight ? "dd-hist-weekly-label-bold" : "dd-hist-weekly-label"}>
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dd-hist-bonus-card">
          <div className="dd-hist-bonus-content">
            <h3 className="dd-hist-bonus-title">Pro Driver Bonus</h3>
            <p className="dd-hist-bonus-text">
              Complete 5 more deliveries this week to unlock your $50 weekend bonus!
            </p>
            <div className="dd-hist-bonus-progress-wrap">
              <div className="dd-hist-bonus-progress-top">
                <p className="dd-hist-bonus-count">15/20</p>
                <p className="dd-hist-bonus-left">5 left</p>
              </div>
              <div className="dd-hist-bonus-track">
                <div className="dd-hist-bonus-fill" style={{ width: "75%" }} />
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined dd-hist-bonus-bg-icon">local_shipping</span>
        </div>
      </section>
    </DriverLayout>
  );
}

export default DriverOrderHistory;
