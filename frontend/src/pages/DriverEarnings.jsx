import DriverLayout from "../components/driver/DriverLayout";

const CHART_BARS = [
  { height: "24%", label: "MON" },
  { height: "32%", label: "TUE" },
  { height: "40%", label: "WED" },
  { height: "48%", label: "THU", highlight: true, tooltip: "$1,240" },
  { height: "36%", label: "FRI" },
  { height: "28%", label: "SAT" },
  { height: "16%", label: "SUN" },
];

const PAYOUTS = [
  {
    id: "#TRX-982341",
    date: "Oct 24, 2023",
    status: "Completed",
    statusClass: "dd-earn-badge-completed",
    method: "Direct Deposit (****42)",
    amount: "$1,420.00",
  },
  {
    id: "#TRX-982105",
    date: "Oct 17, 2023",
    status: "Completed",
    statusClass: "dd-earn-badge-completed",
    method: "Direct Deposit (****42)",
    amount: "$980.50",
  },
  {
    id: "#TRX-981992",
    date: "Oct 10, 2023",
    status: "Pending",
    statusClass: "dd-earn-badge-pending",
    method: "Direct Deposit (****42)",
    amount: "$1,120.00",
  },
  {
    id: "#TRX-981773",
    date: "Oct 03, 2023",
    status: "Failed",
    statusClass: "dd-earn-badge-failed",
    method: "Direct Deposit (****42)",
    amount: "$840.00",
  },
];

function DriverEarnings() {
  return (
    <DriverLayout>
      <div className="dd-page-header">
        <h1 className="dd-page-title">Earnings Overview</h1>
        <p className="dd-page-subtitle">Track your daily revenue and weekly payouts.</p>
      </div>

      <div className="dd-earn-bento">
        <div className="dd-earn-balance-card">
          <div className="dd-earn-balance-top">
            <div>
              <p className="dd-earn-label">Total Balance</p>
              <h2 className="dd-earn-balance-value">$4,280.50</h2>
            </div>
            <span className="dd-earn-trend">
              <span className="material-symbols-outlined">trending_up</span>
              +12%
            </span>
          </div>
          <div className="dd-earn-chart">
            {CHART_BARS.map((bar) => (
              <div key={bar.label} className="dd-earn-chart-col">
                <div
                  className={`dd-earn-chart-bar ${bar.highlight ? "dd-earn-chart-bar-highlight" : ""}`}
                  style={{ height: bar.height }}
                >
                  {bar.tooltip ? (
                    <span className="dd-earn-chart-tooltip">{bar.tooltip}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="dd-earn-chart-labels">
            {CHART_BARS.map((bar) => (
              <span key={bar.label}>{bar.label}</span>
            ))}
          </div>
        </div>

        <div className="dd-earn-withdraw-card">
          <div>
            <h3 className="dd-earn-withdraw-title">Available for Withdrawal</h3>
            <p className="dd-earn-withdraw-value">$840.00</p>
          </div>
          <button type="button" className="dd-earn-withdraw-btn">
            Withdraw Now
          </button>
        </div>

        <div className="dd-earn-metrics-card">
          <div>
            <p className="dd-earn-label">Average Per Trip</p>
            <div className="dd-earn-metric-row">
              <div className="dd-earn-metric-icon dd-earn-metric-icon-green">
                <span className="material-symbols-outlined">directions_car</span>
              </div>
              <p className="dd-earn-metric-value">$18.50</p>
            </div>
          </div>
          <hr className="dd-earn-divider" />
          <div>
            <p className="dd-earn-label">Tips (This Week)</p>
            <div className="dd-earn-metric-row">
              <div className="dd-earn-metric-icon dd-earn-metric-icon-amber">
                <span className="material-symbols-outlined">volunteer_activism</span>
              </div>
              <p className="dd-earn-metric-value">$245.00</p>
            </div>
          </div>
        </div>
      </div>

      <section className="dd-earn-payouts-panel">
        <div className="dd-earn-payouts-header">
          <h3 className="dd-earn-section-title">Recent Payouts</h3>
          <div className="dd-earn-icon-actions">
            <button type="button" className="dd-earn-icon-btn" aria-label="Filter payouts">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button type="button" className="dd-earn-icon-btn" aria-label="Download payouts">
              <span className="material-symbols-outlined">file_download</span>
            </button>
          </div>
        </div>
        <div className="dd-earn-table-wrap">
          <table className="dd-earn-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Method</th>
                <th className="dd-earn-th-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {PAYOUTS.map((payout) => (
                <tr key={payout.id}>
                  <td className="dd-earn-td-bold">{payout.id}</td>
                  <td className="dd-earn-td-muted">{payout.date}</td>
                  <td>
                    <span className={`dd-earn-badge ${payout.statusClass}`}>{payout.status}</span>
                  </td>
                  <td className="dd-earn-td-muted">{payout.method}</td>
                  <td className="dd-earn-td-right dd-earn-td-bold">{payout.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dd-earn-payouts-footer">
          <p className="dd-earn-footer-text">Showing 4 of 24 payouts</p>
          <div className="dd-earn-pagination">
            <button type="button" className="dd-earn-page-btn">
              Previous
            </button>
            <button type="button" className="dd-earn-page-btn dd-earn-page-btn-active">
              Next
            </button>
          </div>
        </div>
      </section>

      <div className="dd-earn-insights-grid">
        <div className="dd-earn-insight-card">
          <div className="dd-earn-insight-blob" aria-hidden />
          <div className="dd-earn-insight-visual">
            <div className="dd-earn-insight-placeholder">
              <span className="material-symbols-outlined">analytics</span>
            </div>
          </div>
          <div className="dd-earn-insight-content">
            <h3 className="dd-earn-insight-title">Earnings Insight</h3>
            <p className="dd-earn-insight-text">
              Drivers in your area earned 20% more on Friday evenings between 6 PM and 10 PM last
              month. Plan your schedule to maximize your hourly rate.
            </p>
            <button type="button" className="dd-earn-link-btn">
              View heat map
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="dd-earn-tax-card">
          <h3 className="dd-earn-section-title">Tax Preparation</h3>
          <p className="dd-earn-tax-text">
            Download your annual earnings statement and summary for your tax records.
          </p>
          <button type="button" className="dd-earn-tax-btn">
            <span className="material-symbols-outlined">receipt</span>
            Get 2023 Summary
          </button>
        </div>
      </div>
    </DriverLayout>
  );
}

export default DriverEarnings;
