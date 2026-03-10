/* ============================================
   AI Accountant — Growth Dashboard App
   ============================================ */

(function () {
  "use strict";

  // ── Chart.js Global Config ──
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = "#94a3b8";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.tooltip.backgroundColor = "#1a2236";
  Chart.defaults.plugins.tooltip.titleColor = "#f1f5f9";
  Chart.defaults.plugins.tooltip.bodyColor = "#94a3b8";
  Chart.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,0.08)";
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.elements.bar.borderRadius = 4;
  Chart.defaults.elements.line.tension = 0.35;
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.animation = { duration: 800, easing: "easeOutQuart" };
  Chart.defaults.scale = Chart.defaults.scale || {};

  // ── State ──
  const state = {
    currentSection: "overview",
    charts: {},
    theme: "dark",
  };

  // ── SECTION HEADERS ──
  const sectionTitles = {
    overview: "Overview",
    sales: "Sales Intelligence",
    returns: "Returns Analysis",
    adspend: "Ad Spend",
    settlements: "Settlement Reconciliation",
    feeaudit: "Fee Audit",
    pl: "Profit & Loss",
    skuprofitability: "SKU Profitability",
    cashflow: "Cash Flow",
    forecast: "Forecast",
    gst: "GST Command Center",
    "tcs-tds": "TCS / TDS Tracker",
    compliance: "Compliance",
    inventory: "Inventory",
    stock: "Stock Transfers",
    tally: "Tally Sync",
    bankrecon: "Bank Reconciliation",
    payroll: "Payroll",
  };

  // ── FORMAT HELPERS ──
  function formatINR(val, decimals) {
    if (decimals === undefined) decimals = 2;
    if (Math.abs(val) >= 10000000)
      return "₹" + (val / 10000000).toFixed(decimals) + "Cr";
    if (Math.abs(val) >= 100000)
      return "₹" + (val / 100000).toFixed(decimals) + "L";
    if (Math.abs(val) >= 1000)
      return "₹" + (val / 1000).toFixed(1) + "K";
    return "₹" + val.toFixed(decimals);
  }

  function formatINRAxis(val) {
    if (Math.abs(val) >= 10000000)
      return "₹" + (val / 10000000).toFixed(1) + "Cr";
    if (Math.abs(val) >= 100000)
      return "₹" + (val / 100000).toFixed(1) + "L";
    if (Math.abs(val) >= 1000)
      return "₹" + (val / 1000).toFixed(0) + "K";
    return "₹" + val;
  }

  function formatNum(val) {
    return val.toLocaleString("en-IN");
  }

  // ── SECTION RENDERERS ──

  // === 1. OVERVIEW ===
  function renderOverview() {
    return `
      <div class="sync-bar">
        <span style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary);margin-right:var(--space-2);">SYNC STATUS</span>
        <div class="sync-item"><span class="sync-dot connected"></span><span class="sync-label">Amazon</span> Connected</div>
        <div class="sync-item"><span class="sync-dot connected"></span><span class="sync-label">Flipkart</span> Connected</div>
        <div class="sync-item"><span class="sync-dot syncing"></span><span class="sync-label">Myntra</span> Syncing</div>
        <div class="summary-divider"></div>
        <div class="sync-item"><span class="sync-dot connected"></span><span class="sync-label">Tally</span> Last sync: 2h ago</div>
      </div>

      <div class="alert-grid">
        <div class="alert-card">
          <div class="alert-icon warning">⚠</div>
          <div class="alert-content">
            <div class="alert-title">23 settlement mismatches worth ₹1.47L need review</div>
            <div class="alert-meta">Settlements · 3 hours ago</div>
          </div>
        </div>
        <div class="alert-card">
          <div class="alert-icon error">⏰</div>
          <div class="alert-content">
            <div class="alert-title">GSTR-1 for Punjab GSTIN due in 4 days</div>
            <div class="alert-meta">GST Compliance · Due Mar 10</div>
          </div>
        </div>
        <div class="alert-card">
          <div class="alert-icon info">💰</div>
          <div class="alert-content">
            <div class="alert-title">TCS credit of ₹2.3L available to claim</div>
            <div class="alert-meta">TCS/TDS · Action required</div>
          </div>
        </div>
        <div class="alert-card">
          <div class="alert-icon warning">📦</div>
          <div class="alert-content">
            <div class="alert-title">Stock transfer Gurgaon → Patna missing delivery challan</div>
            <div class="alert-meta">Stock Transfers · 1 day ago</div>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Revenue (MTD)</div>
          <div class="kpi-value">₹38.7L</div>
          <div class="kpi-delta positive">↑ 12.3% vs last month</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Net Payout (MTD)</div>
          <div class="kpi-value">₹31.2L</div>
          <div class="kpi-delta positive">↑ 8.7% vs last month</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Open Recon Items</div>
          <div class="kpi-value">23</div>
          <div class="kpi-delta negative">↑ 5 from last week</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">GST Compliance Score</div>
          <div class="kpi-value">87%</div>
          <div class="kpi-delta positive">↑ 3% this month</div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <span class="chart-title">Revenue Trend — Last 7 Days</span>
        </div>
        <div class="chart-canvas-wrap" style="height:280px;">
          <canvas id="overviewChart"></canvas>
        </div>
      </div>
    `;
  }

  function initOverviewChart() {
    const ctx = document.getElementById("overviewChart");
    if (!ctx) return;
    const labels = ["28 Feb", "1 Mar", "2 Mar", "3 Mar", "4 Mar", "5 Mar", "6 Mar"];
    state.charts.overview = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Amazon",
            data: [420000, 385000, 450000, 410000, 470000, 440000, 460000],
            borderColor: "#14b8a6",
            backgroundColor: "rgba(20,184,166,0.1)",
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Flipkart",
            data: [120000, 135000, 115000, 140000, 125000, 145000, 130000],
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.1)",
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Myntra",
            data: [32000, 28000, 35000, 30000, 38000, 34000, 36000],
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245,158,11,0.1)",
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "top", align: "end" },
          tooltip: {
            callbacks: {
              label: function (c) {
                return c.dataset.label + ": " + formatINR(c.parsed.y, 0);
              },
            },
          },
        },
        scales: {
          y: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              maxTicksLimit: 6,
              callback: function (v) {
                return formatINRAxis(v);
              },
            },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }

  // === 2. SALES INTELLIGENCE ===
  function renderSales() {
    return `
      <div class="chart-header mb-4">
        <div class="filter-tabs" id="salesPeriodTabs">
          <button class="filter-tab active" data-period="this">This Month</button>
          <button class="filter-tab" data-period="last">Last Month</button>
          <button class="filter-tab" data-period="custom">Custom</button>
        </div>
        <div class="filter-tabs" id="salesMpTabs">
          <button class="filter-tab active" data-mp="all">All</button>
          <button class="filter-tab" data-mp="amazon">Amazon</button>
          <button class="filter-tab" data-mp="flipkart">Flipkart</button>
          <button class="filter-tab" data-mp="myntra">Myntra</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Gross Sales</div>
          <div class="kpi-value">₹41.8L</div>
          <div class="kpi-delta positive">↑ 14.2%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Returns</div>
          <div class="kpi-value">₹3.1L</div>
          <div class="kpi-delta negative">↑ 7.4% return rate</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Net Sales</div>
          <div class="kpi-value">₹38.7L</div>
          <div class="kpi-delta positive">↑ 12.3%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Avg Order Value</div>
          <div class="kpi-value">₹379</div>
          <div class="kpi-delta positive">↑ 5.1%</div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <span class="chart-title">Daily Sales by Marketplace</span>
          <span class="badge badge-neutral">~10,200 orders this month</span>
        </div>
        <div class="chart-canvas-wrap" style="height:320px;">
          <canvas id="salesChart"></canvas>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <span class="table-title">Top 10 SKUs by Revenue</span>
          <button class="btn btn-ghost">Export CSV</button>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Marketplace</th>
                <th>Units Sold</th>
                <th>Gross (₹)</th>
                <th>Returns (₹)</th>
                <th>Net (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="mono">RAC-DF-10K</td>
                <td>Premium Dog Food 10kg</td>
                <td><span class="badge badge-primary">Amazon</span></td>
                <td class="mono">1,840</td>
                <td class="mono">16,10,000</td>
                <td class="mono">1,38,000</td>
                <td class="mono">14,72,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-DF-5K</td>
                <td>Premium Dog Food 5kg</td>
                <td><span class="badge badge-primary">Amazon</span></td>
                <td class="mono">1,220</td>
                <td class="mono">5,49,000</td>
                <td class="mono">38,000</td>
                <td class="mono">5,11,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-CF-5K</td>
                <td>Premium Cat Food 5kg</td>
                <td><span class="badge badge-info">Flipkart</span></td>
                <td class="mono">980</td>
                <td class="mono">4,41,000</td>
                <td class="mono">32,000</td>
                <td class="mono">4,09,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-DT-MX</td>
                <td>Dog Treats Mixed Pack</td>
                <td><span class="badge badge-primary">Amazon</span></td>
                <td class="mono">1,560</td>
                <td class="mono">3,90,000</td>
                <td class="mono">28,000</td>
                <td class="mono">3,62,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-PS-LG</td>
                <td>Pet Shampoo Large</td>
                <td><span class="badge badge-info">Flipkart</span></td>
                <td class="mono">820</td>
                <td class="mono">2,87,000</td>
                <td class="mono">18,000</td>
                <td class="mono">2,69,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-CT-PR</td>
                <td>Cat Treats Premium</td>
                <td><span class="badge badge-warning">Myntra</span></td>
                <td class="mono">640</td>
                <td class="mono">1,92,000</td>
                <td class="mono">14,000</td>
                <td class="mono">1,78,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-DB-MD</td>
                <td>Dog Bed Medium</td>
                <td><span class="badge badge-primary">Amazon</span></td>
                <td class="mono">380</td>
                <td class="mono">1,71,000</td>
                <td class="mono">22,000</td>
                <td class="mono">1,49,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-CL-SM</td>
                <td>Pet Collar Small</td>
                <td><span class="badge badge-info">Flipkart</span></td>
                <td class="mono">920</td>
                <td class="mono">1,38,000</td>
                <td class="mono">9,000</td>
                <td class="mono">1,29,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-LH-AD</td>
                <td>Dog Leash Adjustable</td>
                <td><span class="badge badge-primary">Amazon</span></td>
                <td class="mono">710</td>
                <td class="mono">1,24,000</td>
                <td class="mono">8,000</td>
                <td class="mono">1,16,000</td>
              </tr>
              <tr>
                <td class="mono">RAC-VT-SP</td>
                <td>Vitamin Supplement</td>
                <td><span class="badge badge-warning">Myntra</span></td>
                <td class="mono">540</td>
                <td class="mono">97,200</td>
                <td class="mono">7,200</td>
                <td class="mono">90,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function initSalesChart() {
    const ctx = document.getElementById("salesChart");
    if (!ctx) return;
    var days = [];
    for (var i = 1; i <= 28; i++) {
      days.push(i + " Mar");
    }
    // just show first 6 days for demo
    days = ["1 Mar", "2 Mar", "3 Mar", "4 Mar", "5 Mar", "6 Mar"];
    var amazon = [98000, 105000, 92000, 110000, 95000, 102000];
    var flipkart = [28000, 31000, 26000, 33000, 29000, 30000];
    var myntra = [7500, 8200, 7000, 8800, 7200, 7800];

    state.charts.sales = new Chart(ctx, {
      type: "bar",
      data: {
        labels: days,
        datasets: [
          {
            label: "Amazon",
            data: amazon,
            backgroundColor: "#14b8a6",
          },
          {
            label: "Flipkart",
            data: flipkart,
            backgroundColor: "#6366f1",
          },
          {
            label: "Myntra",
            data: myntra,
            backgroundColor: "#f59e0b",
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "top", align: "end" },
          tooltip: {
            callbacks: {
              label: function (c) {
                return c.dataset.label + ": " + formatINR(c.parsed.y, 0);
              },
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: {
            stacked: true,
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              maxTicksLimit: 6,
              callback: function (v) {
                return formatINRAxis(v);
              },
            },
          },
        },
      },
    });
  }

  // === 3. SETTLEMENTS ===
  function renderSettlements() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Settlements</div>
          <div class="kpi-value">₹29.8L</div>
          <div class="kpi-delta neutral">MTD</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Matched</div>
          <div class="kpi-value">₹28.33L</div>
          <div class="kpi-delta positive">95.1% matched</div>
          <div class="recon-bar"><div class="recon-bar-fill" style="width:95.1%"></div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Unmatched</div>
          <div class="kpi-value">₹1.47L</div>
          <div class="kpi-delta negative">4.9% unmatched</div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <span class="chart-title">Settlement Waterfall</span>
          <span class="text-faint" style="font-size:var(--text-xs);">Gross Sales → Net Settlement</span>
        </div>
        <div class="chart-canvas-wrap" style="height:340px;">
          <canvas id="waterfallChart"></canvas>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <span class="table-title">Unmatched Items</span>
          <span class="badge badge-error">23 items</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Settlement ID</th>
                <th>Date</th>
                <th>Expected (₹)</th>
                <th>Received (₹)</th>
                <th>Gap (₹)</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="mono">STL-24031201</td>
                <td>1 Mar</td>
                <td class="mono">42,350</td>
                <td class="mono">39,120</td>
                <td class="mono text-error">-3,230</td>
                <td>Commission overcharge</td>
                <td><span class="badge badge-warning">Under Review</span></td>
              </tr>
              <tr>
                <td class="mono">STL-24031202</td>
                <td>1 Mar</td>
                <td class="mono">18,900</td>
                <td class="mono">18,900</td>
                <td class="mono text-error">-0</td>
                <td>Return in transit</td>
                <td><span class="badge badge-info">Pending</span></td>
              </tr>
              <tr>
                <td class="mono">STL-24031205</td>
                <td>2 Mar</td>
                <td class="mono">67,200</td>
                <td class="mono">62,800</td>
                <td class="mono text-error">-4,400</td>
                <td>Duplicate deduction</td>
                <td><span class="badge badge-error">Escalated</span></td>
              </tr>
              <tr>
                <td class="mono">STL-24031208</td>
                <td>3 Mar</td>
                <td class="mono">31,500</td>
                <td class="mono">28,700</td>
                <td class="mono text-error">-2,800</td>
                <td>Next cycle</td>
                <td><span class="badge badge-neutral">Deferred</span></td>
              </tr>
              <tr>
                <td class="mono">STL-24031210</td>
                <td>3 Mar</td>
                <td class="mono">24,100</td>
                <td class="mono">22,350</td>
                <td class="mono text-error">-1,750</td>
                <td>Commission overcharge</td>
                <td><span class="badge badge-warning">Under Review</span></td>
              </tr>
              <tr>
                <td class="mono">STL-24031215</td>
                <td>4 Mar</td>
                <td class="mono">55,600</td>
                <td class="mono">51,200</td>
                <td class="mono text-error">-4,400</td>
                <td>Return in transit</td>
                <td><span class="badge badge-info">Pending</span></td>
              </tr>
              <tr>
                <td class="mono">STL-24031220</td>
                <td>5 Mar</td>
                <td class="mono">38,400</td>
                <td class="mono">35,900</td>
                <td class="mono text-error">-2,500</td>
                <td>Duplicate deduction</td>
                <td><span class="badge badge-error">Escalated</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function initWaterfallChart() {
    const ctx = document.getElementById("waterfallChart");
    if (!ctx) return;

    // Simulated waterfall data
    var labels = [
      "Gross Sales",
      "Returns",
      "Commission",
      "Shipping",
      "TCS",
      "TDS",
      "Other Fees",
      "Net Settlement",
    ];
    var values = [3870000, -310000, -530000, -310000, -230000, -180000, -110000, 2200000];
    var running = [];
    var positives = [];
    var negatives = [];
    var bases = [];

    var cum = 0;
    for (var i = 0; i < values.length; i++) {
      if (i === 0) {
        bases.push(0);
        positives.push(values[i]);
        negatives.push(0);
        cum = values[i];
      } else if (i === values.length - 1) {
        // Final bar starts from 0
        bases.push(0);
        positives.push(values[i]);
        negatives.push(0);
      } else {
        bases.push(cum + values[i]);
        positives.push(0);
        negatives.push(-values[i]);
        cum += values[i];
      }
    }

    state.charts.waterfall = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Base",
            data: bases,
            backgroundColor: "transparent",
            borderWidth: 0,
            barPercentage: 0.6,
          },
          {
            label: "Positive",
            data: positives,
            backgroundColor: function (context) {
              var idx = context.dataIndex;
              if (idx === 0 || idx === labels.length - 1) return "#14b8a6";
              return "#22c55e";
            },
            barPercentage: 0.6,
          },
          {
            label: "Deductions",
            data: negatives,
            backgroundColor: "#ef4444",
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (c) {
                if (c.datasetIndex === 0) return "";
                return formatINR(c.parsed.y, 0);
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { size: 10 } },
          },
          y: {
            stacked: true,
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              maxTicksLimit: 6,
              callback: function (v) {
                return formatINRAxis(v);
              },
            },
          },
        },
      },
    });
  }

  // === 4. GST COMMAND CENTER ===
  function renderGST() {
    return `
      <div class="gstin-grid">
        <div class="gstin-card">
          <div class="gstin-header">
            <span class="gstin-state">Punjab</span>
            <span class="badge badge-primary">Primary</span>
          </div>
          <div class="gstin-number">07AXXXX1234</div>
          <div class="gstin-sales">₹18.2L</div>
          <div class="gstin-status-row">
            <span class="gstin-status-label">GSTR-1</span>
            <span class="badge badge-success">Filed ✓</span>
          </div>
          <div class="gstin-status-row">
            <span class="gstin-status-label">GSTR-3B</span>
            <span class="badge badge-success">Filed ✓</span>
          </div>
        </div>

        <div class="gstin-card">
          <div class="gstin-header">
            <span class="gstin-state">Haryana</span>
            <span class="badge badge-neutral">Warehouse</span>
          </div>
          <div class="gstin-number">06AXXXX5678</div>
          <div class="gstin-sales">₹12.1L</div>
          <div class="gstin-status-row">
            <span class="gstin-status-label">GSTR-1</span>
            <span class="badge badge-success">Filed ✓</span>
          </div>
          <div class="gstin-status-row">
            <span class="gstin-status-label">GSTR-3B</span>
            <span class="badge badge-warning">Pending ⚠</span>
          </div>
        </div>

        <div class="gstin-card">
          <div class="gstin-header">
            <span class="gstin-state">Maharashtra</span>
            <span class="badge badge-neutral">FBA</span>
          </div>
          <div class="gstin-number">27AXXXX9012</div>
          <div class="gstin-sales">₹6.3L</div>
          <div class="gstin-status-row">
            <span class="gstin-status-label">GSTR-1</span>
            <span class="badge badge-warning">Pending ⚠</span>
          </div>
          <div class="gstin-status-row">
            <span class="gstin-status-label">GSTR-3B</span>
            <span class="badge badge-warning">Pending ⚠</span>
          </div>
        </div>

        <div class="gstin-card">
          <div class="gstin-header">
            <span class="gstin-state">West Bengal</span>
            <span class="badge badge-neutral">FBA</span>
          </div>
          <div class="gstin-number">19AXXXX3456</div>
          <div class="gstin-sales">₹2.1L</div>
          <div class="gstin-status-row">
            <span class="gstin-status-label">GSTR-1</span>
            <span class="badge badge-success">Filed ✓</span>
          </div>
          <div class="gstin-status-row">
            <span class="gstin-status-label">GSTR-3B</span>
            <span class="badge badge-success">Filed ✓</span>
          </div>
        </div>
      </div>

      <div class="section-title" style="font-size:var(--text-base);margin-top:var(--space-4)">Filing Calendar</div>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-connector"></div>
          <div class="timeline-dot filed"></div>
          <div class="timeline-label">GSTR-1<br>Punjab<br><strong style="color:var(--color-success-text)">Filed</strong></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-connector"></div>
          <div class="timeline-dot filed"></div>
          <div class="timeline-label">GSTR-1<br>Haryana<br><strong style="color:var(--color-success-text)">Filed</strong></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-connector"></div>
          <div class="timeline-dot pending"></div>
          <div class="timeline-label">GSTR-1<br>Maharashtra<br><strong style="color:var(--color-warning-text)">Due Mar 10</strong></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-connector"></div>
          <div class="timeline-dot filed"></div>
          <div class="timeline-label">GSTR-3B<br>Punjab<br><strong style="color:var(--color-success-text)">Filed</strong></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-connector"></div>
          <div class="timeline-dot pending"></div>
          <div class="timeline-label">GSTR-3B<br>Haryana<br><strong style="color:var(--color-warning-text)">Due Mar 20</strong></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot pending"></div>
          <div class="timeline-label">GSTR-3B<br>Maharashtra<br><strong style="color:var(--color-warning-text)">Due Mar 20</strong></div>
        </div>
      </div>

      <div class="table-container" style="margin-top:var(--space-6)">
        <div class="table-header">
          <span class="table-title">ITC Summary</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>GSTIN</th>
                <th>Input CGST</th>
                <th>Input SGST</th>
                <th>Input IGST</th>
                <th>Output Tax</th>
                <th>Net Payable</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Punjab (07…1234)</td>
                <td class="mono">1,82,000</td>
                <td class="mono">1,82,000</td>
                <td class="mono">76,000</td>
                <td class="mono">5,46,000</td>
                <td class="mono text-error">1,06,000</td>
              </tr>
              <tr>
                <td>Haryana (06…5678)</td>
                <td class="mono">1,21,000</td>
                <td class="mono">1,21,000</td>
                <td class="mono">54,000</td>
                <td class="mono">3,63,000</td>
                <td class="mono text-error">67,000</td>
              </tr>
              <tr>
                <td>Maharashtra (27…9012)</td>
                <td class="mono">63,000</td>
                <td class="mono">63,000</td>
                <td class="mono">28,000</td>
                <td class="mono">1,89,000</td>
                <td class="mono text-error">35,000</td>
              </tr>
              <tr>
                <td>West Bengal (19…3456)</td>
                <td class="mono">21,000</td>
                <td class="mono">21,000</td>
                <td class="mono">12,000</td>
                <td class="mono">63,000</td>
                <td class="mono text-error">9,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="kpi-grid" style="margin-top:var(--space-6)">
        <div class="kpi-card">
          <div class="kpi-label">GSTR-2A/2B Match</div>
          <div class="kpi-value">92.3%</div>
          <div class="kpi-delta positive">↑ 2.1% from last month</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Vendor Mismatches</div>
          <div class="kpi-value">14</div>
          <div class="kpi-delta negative">↓ 3 vendors unresolved</div>
        </div>
      </div>
    `;
  }

  // === 5. TCS / TDS TRACKER ===
  function renderTCSTDS() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total TCS Deducted</div>
          <div class="kpi-value">₹2.3L</div>
          <div class="kpi-delta neutral">FY 2025-26</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TCS Claimed</div>
          <div class="kpi-value">₹1.8L</div>
          <div class="kpi-delta positive">78.3% claimed</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TCS Unclaimed</div>
          <div class="kpi-value">₹0.5L</div>
          <div class="kpi-delta warning" style="color:var(--color-warning-text)">Action needed</div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <span class="chart-title">TCS by Marketplace</span>
        </div>
        <div class="chart-canvas-wrap" style="height:240px;">
          <canvas id="tcsPieChart"></canvas>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total TDS Deducted</div>
          <div class="kpi-value">₹3.1L</div>
          <div class="kpi-delta neutral">FY 2025-26</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TDS Claimed via ITR</div>
          <div class="kpi-value">₹2.8L</div>
          <div class="kpi-delta positive">90.3% claimed</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TDS Pending</div>
          <div class="kpi-value">₹0.3L</div>
          <div class="kpi-delta warning" style="color:var(--color-warning-text)">Verify in 26AS</div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <span class="chart-title">Monthly TCS: Deducted vs Claimed</span>
        </div>
        <div class="chart-canvas-wrap" style="height:280px;">
          <canvas id="tcsTrendChart"></canvas>
        </div>
      </div>

      <div class="section-title" style="font-size:var(--text-base)">Action Items</div>
      <div class="action-items">
        <div class="action-item">
          <div class="action-dot"></div>
          <div class="action-text">File TCS claim for Q3 — ₹0.5L pending</div>
          <span class="action-btn">File Now →</span>
        </div>
        <div class="action-item">
          <div class="action-dot" style="background:var(--color-info)"></div>
          <div class="action-text">Verify Form 26AS for TDS credit — ₹0.3L unmatched</div>
          <span class="action-btn">Verify →</span>
        </div>
        <div class="action-item">
          <div class="action-dot" style="background:var(--color-success)"></div>
          <div class="action-text">Q2 TCS claim successfully processed — ₹0.6L credited</div>
          <span class="action-btn" style="color:var(--color-success-text)">Done ✓</span>
        </div>
      </div>
    `;
  }

  function initTCSCharts() {
    var ctx1 = document.getElementById("tcsPieChart");
    if (ctx1) {
      state.charts.tcsPie = new Chart(ctx1, {
        type: "doughnut",
        data: {
          labels: ["Amazon", "Flipkart", "Myntra"],
          datasets: [
            {
              data: [140000, 70000, 20000],
              backgroundColor: ["#14b8a6", "#6366f1", "#f59e0b"],
              borderWidth: 0,
              hoverOffset: 8,
            },
          ],
        },
        options: {
          cutout: "65%",
          plugins: {
            legend: { position: "right" },
            tooltip: {
              callbacks: {
                label: function (c) {
                  return c.label + ": " + formatINR(c.parsed, 0);
                },
              },
            },
          },
        },
      });
    }

    var ctx2 = document.getElementById("tcsTrendChart");
    if (ctx2) {
      state.charts.tcsTrend = new Chart(ctx2, {
        type: "bar",
        data: {
          labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
          datasets: [
            {
              label: "Deducted",
              data: [35000, 38000, 42000, 40000, 37000, 38000],
              backgroundColor: "#6366f1",
              barPercentage: 0.5,
            },
            {
              label: "Claimed",
              data: [30000, 35000, 38000, 32000, 35000, 30000],
              backgroundColor: "#14b8a6",
              barPercentage: 0.5,
            },
          ],
        },
        options: {
          plugins: {
            legend: { position: "top", align: "end" },
            tooltip: {
              callbacks: {
                label: function (c) {
                  return c.dataset.label + ": " + formatINR(c.parsed.y, 0);
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: {
                maxTicksLimit: 6,
                callback: function (v) {
                  return formatINRAxis(v);
                },
              },
            },
          },
        },
      });
    }
  }

  // === 6. STOCK TRANSFERS ===
  function renderStock() {
    return `
      <div class="section-title" style="font-size:var(--text-base)">Active Transfers</div>
      <div class="transfer-grid">
        <div class="transfer-card">
          <div class="transfer-route">
            Gurgaon <span class="arrow">→</span> Mumbai
            <span class="badge badge-info" style="margin-left:auto">Amazon FBA</span>
          </div>
          <div class="transfer-details">
            <div><div class="transfer-detail-item">Units</div><div class="transfer-detail-value">500</div></div>
            <div><div class="transfer-detail-item">Value</div><div class="transfer-detail-value">₹4.2L</div></div>
            <div><div class="transfer-detail-item">IGST</div><div class="transfer-detail-value">₹0.76L</div></div>
            <div><div class="transfer-detail-item">Status</div><div class="transfer-detail-value"><span class="badge badge-info">In Transit</span></div></div>
          </div>
        </div>

        <div class="transfer-card">
          <div class="transfer-route">
            Gurgaon <span class="arrow">→</span> Patna
            <span class="badge badge-warning" style="margin-left:auto">FBA</span>
          </div>
          <div class="transfer-details">
            <div><div class="transfer-detail-item">Units</div><div class="transfer-detail-value">200</div></div>
            <div><div class="transfer-detail-item">Value</div><div class="transfer-detail-value">₹1.6L</div></div>
            <div><div class="transfer-detail-item">IGST</div><div class="transfer-detail-value">₹0.29L</div></div>
            <div><div class="transfer-detail-item">Status</div><div class="transfer-detail-value"><span class="badge badge-warning">Challan Pending ⚠</span></div></div>
          </div>
        </div>

        <div class="transfer-card">
          <div class="transfer-route">
            Punjab <span class="arrow">→</span> Gurgaon
            <span class="badge badge-success" style="margin-left:auto">Replenishment</span>
          </div>
          <div class="transfer-details">
            <div><div class="transfer-detail-item">Units</div><div class="transfer-detail-value">1,000</div></div>
            <div><div class="transfer-detail-item">Value</div><div class="transfer-detail-value">₹8.5L</div></div>
            <div><div class="transfer-detail-item">IGST</div><div class="transfer-detail-value">—</div></div>
            <div><div class="transfer-detail-item">Status</div><div class="transfer-detail-value"><span class="badge badge-success">Completed ✓</span></div></div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <span class="table-title">IGST Impact Table</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>From State</th>
                <th>To State</th>
                <th>Transfer Value</th>
                <th>IGST Charged</th>
                <th>ITC Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Haryana</td>
                <td>Maharashtra</td>
                <td class="mono">4,20,000</td>
                <td class="mono">75,600</td>
                <td class="mono">75,600</td>
                <td><span class="badge badge-info">In Transit</span></td>
              </tr>
              <tr>
                <td>Haryana</td>
                <td>Bihar</td>
                <td class="mono">1,60,000</td>
                <td class="mono">28,800</td>
                <td class="mono">28,800</td>
                <td><span class="badge badge-warning">Challan Pending</span></td>
              </tr>
              <tr>
                <td>Punjab</td>
                <td>Haryana</td>
                <td class="mono">8,50,000</td>
                <td class="mono">—</td>
                <td class="mono">—</td>
                <td><span class="badge badge-success">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="section-title" style="font-size:var(--text-base)">Delivery Challan Status</div>
      <div class="challan-stats">
        <div class="challan-stat">
          <div class="challan-stat-count text-warning">2</div>
          <div class="challan-stat-label">Pending</div>
        </div>
        <div class="challan-stat">
          <div class="challan-stat-count text-info">5</div>
          <div class="challan-stat-label">Generated</div>
        </div>
        <div class="challan-stat">
          <div class="challan-stat-count text-success">12</div>
          <div class="challan-stat-label">Matched</div>
        </div>
      </div>
    `;
  }

  // === 7. TALLY SYNC ===
  function renderTally() {
    return `
      <div class="sync-stats">
        <div class="sync-stat">
          <div class="sync-stat-value">2h ago</div>
          <div class="sync-stat-label">Last Sync</div>
        </div>
        <div class="sync-stat">
          <div class="sync-stat-value">847</div>
          <div class="sync-stat-label">Entries Synced Today</div>
        </div>
        <div class="sync-stat">
          <div class="sync-stat-value text-warning">23</div>
          <div class="sync-stat-label">Pending Entries</div>
        </div>
        <div class="sync-stat">
          <div class="sync-stat-value text-error">2</div>
          <div class="sync-stat-label">Failed Entries</div>
        </div>
      </div>

      <div class="section-title" style="font-size:var(--text-base)">Auto-Categorization Preview</div>
      <div class="ledger-grid">
        <div class="ledger-item">
          <div class="ledger-source">Amazon Commission</div>
          <div class="ledger-arrow">→</div>
          <div class="ledger-target">Expenses > Marketplace Fees</div>
        </div>
        <div class="ledger-item">
          <div class="ledger-source">FBA Shipping Fee</div>
          <div class="ledger-arrow">→</div>
          <div class="ledger-target">Expenses > Logistics</div>
        </div>
        <div class="ledger-item">
          <div class="ledger-source">Customer Return</div>
          <div class="ledger-arrow">→</div>
          <div class="ledger-target">Sales Returns</div>
        </div>
        <div class="ledger-item">
          <div class="ledger-source">TCS Deduction</div>
          <div class="ledger-arrow">→</div>
          <div class="ledger-target">Current Assets > TCS Receivable</div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <span class="table-title">Sync Log</span>
          <span class="badge badge-neutral">Today</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Source</th>
                <th>Tally Ledger</th>
                <th>Amount (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="mono">14:22:31</td>
                <td><span class="badge badge-primary">Sales</span></td>
                <td>Amazon</td>
                <td>Sales > Amazon India</td>
                <td class="mono">42,350</td>
                <td><span class="badge badge-success">Synced ✓</span></td>
              </tr>
              <tr>
                <td class="mono">14:22:30</td>
                <td><span class="badge badge-error">Return</span></td>
                <td>Flipkart</td>
                <td>Sales Returns</td>
                <td class="mono">-2,400</td>
                <td><span class="badge badge-success">Synced ✓</span></td>
              </tr>
              <tr>
                <td class="mono">14:22:28</td>
                <td><span class="badge badge-neutral">Fee</span></td>
                <td>Amazon</td>
                <td>Expenses > Marketplace Fees</td>
                <td class="mono">-6,320</td>
                <td><span class="badge badge-success">Synced ✓</span></td>
              </tr>
              <tr>
                <td class="mono">14:20:15</td>
                <td><span class="badge badge-info">Transfer</span></td>
                <td>Stock Transfer</td>
                <td>Stock-in-Hand > Gurgaon WH</td>
                <td class="mono">4,20,000</td>
                <td><span class="badge badge-warning">Pending</span></td>
              </tr>
              <tr>
                <td class="mono">14:18:42</td>
                <td><span class="badge badge-primary">Sales</span></td>
                <td>Myntra</td>
                <td>Sales > Myntra</td>
                <td class="mono">7,800</td>
                <td><span class="badge badge-success">Synced ✓</span></td>
              </tr>
              <tr>
                <td class="mono">14:15:01</td>
                <td><span class="badge badge-neutral">Fee</span></td>
                <td>Flipkart</td>
                <td>Expenses > Logistics</td>
                <td class="mono">-3,200</td>
                <td><span class="badge badge-error">Failed ✕</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <span class="table-title">Balance Reconciliation — Tally vs Marketplace</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ledger</th>
                <th>Tally Balance (₹)</th>
                <th>Marketplace Balance (₹)</th>
                <th>Difference (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sales > Amazon India</td>
                <td class="mono">28,42,000</td>
                <td class="mono">28,50,000</td>
                <td class="mono text-error">-8,000</td>
                <td><span class="badge badge-warning">Variance</span></td>
              </tr>
              <tr>
                <td>Sales > Flipkart</td>
                <td class="mono">8,10,000</td>
                <td class="mono">8,10,000</td>
                <td class="mono text-success">0</td>
                <td><span class="badge badge-success">Matched</span></td>
              </tr>
              <tr>
                <td>Sales > Myntra</td>
                <td class="mono">2,08,000</td>
                <td class="mono">2,10,000</td>
                <td class="mono text-error">-2,000</td>
                <td><span class="badge badge-warning">Variance</span></td>
              </tr>
              <tr>
                <td>Expenses > Marketplace Fees</td>
                <td class="mono">5,28,000</td>
                <td class="mono">5,30,000</td>
                <td class="mono text-error">-2,000</td>
                <td><span class="badge badge-warning">Variance</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // === 8. P&L ===
  function renderPL() {
    return `
      <div class="chart-header mb-4">
        <select class="entity-select" id="entitySelect">
          <option>All Entities</option>
          <option>Tuoraa Pvt Ltd</option>
          <option>Refit Punjab</option>
          <option>Refit Haryana</option>
        </select>
        <div class="filter-tabs" id="plCompareTabs">
          <button class="filter-tab active">This Month</button>
          <button class="filter-tab">vs Last Month</button>
          <button class="filter-tab">vs Same Month LY</button>
        </div>
      </div>

      <div class="pl-statement">
        <div class="pl-row">
          <span class="pl-label" style="font-weight:600;color:var(--text-primary)">Gross Revenue</span>
          <span class="pl-value">₹38,70,000</span>
        </div>
        <div class="pl-row pl-indent">
          <span class="pl-label">(−) Returns</span>
          <span class="pl-value">₹3,10,000</span>
        </div>
        <div class="pl-row subtotal">
          <span class="pl-label">Net Revenue</span>
          <span class="pl-value">₹35,60,000</span>
        </div>
        <div class="pl-row pl-indent">
          <span class="pl-label">(−) COGS</span>
          <span class="pl-value">₹18,20,000</span>
        </div>
        <div class="pl-row subtotal">
          <span class="pl-label">Gross Profit</span>
          <span><span class="pl-value">₹17,40,000</span><span class="pl-pct">48.9%</span></span>
        </div>
        <div class="pl-row pl-indent">
          <span class="pl-label">(−) Marketplace Fees</span>
          <span class="pl-value">₹5,30,000</span>
        </div>
        <div class="pl-row pl-indent">
          <span class="pl-label">(−) Shipping & Logistics</span>
          <span class="pl-value">₹3,10,000</span>
        </div>
        <div class="pl-row pl-indent">
          <span class="pl-label">(−) Advertising</span>
          <span class="pl-value">₹1,80,000</span>
        </div>
        <div class="pl-row pl-indent">
          <span class="pl-label">(−) Storage Fees</span>
          <span class="pl-value">₹40,000</span>
        </div>
        <div class="pl-row subtotal">
          <span class="pl-label">Operating Profit</span>
          <span><span class="pl-value">₹6,80,000</span><span class="pl-pct">19.1%</span></span>
        </div>
        <div class="pl-row pl-indent">
          <span class="pl-label">(−) GST Net Payable</span>
          <span class="pl-value">₹1,20,000</span>
        </div>
        <div class="pl-row pl-indent">
          <span class="pl-label">(−) TCS/TDS Impact</span>
          <span class="pl-value" style="color:var(--color-success-text)">-₹50,000</span>
        </div>
        <div class="pl-row total">
          <span class="pl-label">Net Profit</span>
          <span><span class="pl-value">₹6,10,000</span><span class="pl-pct">17.1%</span></span>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <span class="chart-title">Monthly Operating Margin %</span>
        </div>
        <div class="chart-canvas-wrap" style="height:280px;">
          <canvas id="plMarginChart"></canvas>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <span class="chart-title">Cost Breakdown</span>
        </div>
        <div class="chart-canvas-wrap" style="height:260px;">
          <canvas id="plCostChart"></canvas>
        </div>
      </div>
    `;
  }

  function initPLCharts() {
    var ctx1 = document.getElementById("plMarginChart");
    if (ctx1) {
      state.charts.plMargin = new Chart(ctx1, {
        type: "line",
        data: {
          labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
          datasets: [
            {
              label: "Operating Margin %",
              data: [16.2, 17.8, 18.5, 17.1, 18.3, 19.1],
              borderColor: "#14b8a6",
              backgroundColor: "rgba(20,184,166,0.1)",
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: "#14b8a6",
            },
          ],
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (c) {
                  return "Margin: " + c.parsed.y + "%";
                },
              },
            },
          },
          scales: {
            y: {
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: {
                callback: function (v) {
                  return v + "%";
                },
              },
              min: 12,
              max: 24,
            },
            x: { grid: { display: false } },
          },
        },
      });
    }

    var ctx2 = document.getElementById("plCostChart");
    if (ctx2) {
      state.charts.plCost = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: [
            "COGS",
            "Marketplace Fees",
            "Shipping",
            "Advertising",
            "Storage",
          ],
          datasets: [
            {
              data: [1820000, 530000, 310000, 180000, 40000],
              backgroundColor: [
                "#6366f1",
                "#14b8a6",
                "#f59e0b",
                "#ec4899",
                "#8b5cf6",
              ],
              borderWidth: 0,
              hoverOffset: 8,
            },
          ],
        },
        options: {
          cutout: "60%",
          plugins: {
            legend: { position: "right" },
            tooltip: {
              callbacks: {
                label: function (c) {
                  return c.label + ": " + formatINR(c.parsed, 0);
                },
              },
            },
          },
        },
      });
    }
  }

  // === 9. RETURNS ===
  function renderReturns() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Returns (Mar)</div><div class="kpi-value">1,847</div><div class="kpi-delta negative">▲ 12.3% vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Return Rate</div><div class="kpi-value">8.4%</div><div class="kpi-delta negative">▲ 0.9pp vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Return Value</div><div class="kpi-value">₹18.2L</div><div class="kpi-delta negative">▲ 14.1% vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Net Impact on GMV</div><div class="kpi-value">₹14.6L</div><div class="kpi-delta neutral">After restocking fees</div></div>
      </div>
      <div class="chart-container">
        <div class="chart-header"><span class="chart-title">Monthly Returns Trend</span>
          <div class="filter-tabs"><button class="filter-tab active">Units</button><button class="filter-tab">Value</button></div>
        </div>
        <div class="chart-canvas-wrap" style="height:260px"><canvas id="returnsChart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Returns by Reason</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Reason</th><th>Units</th><th>% of Returns</th><th>Value</th><th>Platform</th></tr></thead>
          <tbody>
            <tr><td>Size / Fit Issue</td><td class="mono">612</td><td class="mono">33.1%</td><td class="mono">₹6.1L</td><td><span class="badge badge-info">Myntra</span></td></tr>
            <tr><td>Product Not as Described</td><td class="mono">398</td><td class="mono">21.5%</td><td class="mono">₹4.8L</td><td><span class="badge badge-warning">Amazon</span></td></tr>
            <tr><td>Defective / Damaged</td><td class="mono">284</td><td class="mono">15.4%</td><td class="mono">₹3.2L</td><td><span class="badge badge-error">Flipkart</span></td></tr>
            <tr><td>Wrong Item Delivered</td><td class="mono">196</td><td class="mono">10.6%</td><td class="mono">₹2.1L</td><td><span class="badge badge-info">Meesho</span></td></tr>
            <tr><td>Buyer Changed Mind</td><td class="mono">357</td><td class="mono">19.3%</td><td class="mono">₹2.0L</td><td><span class="badge badge-neutral">All</span></td></tr>
          </tbody>
        </table></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Top Returned SKUs</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>SKU</th><th>Product</th><th>Returns</th><th>Return Rate</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td class="mono">TUO-APP-1042</td><td>Cotton Kurta Set – M</td><td class="mono">187</td><td><span class="badge badge-error">22.4%</span></td><td><button class="action-btn">Review</button></td></tr>
            <tr><td class="mono">TUO-PET-0338</td><td>Dog Harness – L</td><td class="mono">143</td><td><span class="badge badge-warning">18.1%</span></td><td><button class="action-btn">Review</button></td></tr>
            <tr><td class="mono">TUO-HOM-2291</td><td>Bamboo Bedsheet Set</td><td class="mono">112</td><td><span class="badge badge-warning">14.3%</span></td><td><button class="action-btn">Review</button></td></tr>
            <tr><td class="mono">TUO-KIT-0774</td><td>Stainless Steel Tiffin</td><td class="mono">89</td><td><span class="badge badge-success">6.2%</span></td><td><button class="action-btn">Review</button></td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  function initReturnsChart() {
    var ctx = document.getElementById("returnsChart");
    if (!ctx) return;
    var labels = ["Oct","Nov","Dec","Jan","Feb","Mar"];
    state.charts.returns = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Amazon", data: [410,488,621,532,498,541], backgroundColor: "#14b8a6" },
          { label: "Flipkart", data: [298,341,412,387,362,398], backgroundColor: "#6366f1" },
          { label: "Myntra", data: [187,224,298,251,238,612], backgroundColor: "#f59e0b" },
          { label: "Meesho", data: [142,168,201,188,162,296], backgroundColor: "#ec4899" }
        ]
      },
      options: { scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: function(v){ return v; } } } }, plugins: { legend: { position:"top" } } }
    });
  }

  // === 10. AD SPEND ===
  function renderAdSpend() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Ad Spend (Mar)</div><div class="kpi-value">₹4.8L</div><div class="kpi-delta negative">▲ 8.2% vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Attributed Revenue</div><div class="kpi-value">₹38.4L</div><div class="kpi-delta positive">▲ 18.6% vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Blended ROAS</div><div class="kpi-value">8.0x</div><div class="kpi-delta positive">▲ 0.7x vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Avg ACOS</div><div class="kpi-value">12.5%</div><div class="kpi-delta positive">▼ 1.2pp vs Feb</div></div>
      </div>
      <div class="chart-container">
        <div class="chart-header"><span class="chart-title">Ad Spend vs Attributed Revenue</span></div>
        <div class="chart-canvas-wrap" style="height:260px"><canvas id="adspendChart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Campaign Performance</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Platform</th><th>Campaign</th><th>Spend</th><th>Revenue</th><th>ROAS</th><th>ACOS</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td><span class="badge badge-warning">Amazon</span></td><td>Sponsored Products – Apparel</td><td class="mono">₹1.42L</td><td class="mono">₹13.2L</td><td class="mono">9.3x</td><td class="mono">10.7%</td><td><span class="badge badge-success">Active</span></td></tr>
            <tr><td><span class="badge badge-warning">Amazon</span></td><td>Sponsored Brands – Summer</td><td class="mono">₹0.86L</td><td class="mono">₹6.8L</td><td class="mono">7.9x</td><td class="mono">12.6%</td><td><span class="badge badge-success">Active</span></td></tr>
            <tr><td><span class="badge badge-info">Flipkart</span></td><td>Product Ads – Home & Kitchen</td><td class="mono">₹1.08L</td><td class="mono">₹9.1L</td><td class="mono">8.4x</td><td class="mono">11.9%</td><td><span class="badge badge-success">Active</span></td></tr>
            <tr><td><span class="badge badge-primary">Myntra</span></td><td>Boost – Festive Collection</td><td class="mono">₹0.74L</td><td class="mono">₹5.2L</td><td class="mono">7.0x</td><td class="mono">14.2%</td><td><span class="badge badge-warning">Review</span></td></tr>
            <tr><td><span class="badge badge-neutral">Meesho</span></td><td>Boost – Budget Category</td><td class="mono">₹0.70L</td><td class="mono">₹4.1L</td><td class="mono">5.9x</td><td class="mono">17.1%</td><td><span class="badge badge-error">Pause</span></td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  function initAdSpendChart() {
    var ctx = document.getElementById("adspendChart");
    if (!ctx) return;
    var labels = ["Oct","Nov","Dec","Jan","Feb","Mar"];
    state.charts.adspend = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Ad Spend (₹L)", data: [3.2,3.8,5.1,4.2,4.4,4.8], backgroundColor: "rgba(239,68,68,0.7)", yAxisID:"y1" },
          { label: "Attributed Revenue (₹L)", data: [24.1,28.6,39.2,31.8,32.4,38.4], type:"line", borderColor:"#14b8a6", backgroundColor:"transparent", pointBackgroundColor:"#14b8a6", yAxisID:"y" }
        ]
      },
      options: { scales: { y: { position:"left", ticks:{ callback: function(v){ return "₹"+v+"L"; } } }, y1: { position:"right", grid:{ drawOnChartArea:false }, ticks:{ callback: function(v){ return "₹"+v+"L"; } } } } }
    });
  }

  // === 11. FEE AUDIT ===
  function renderFeeAudit() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Fees Charged</div><div class="kpi-value">₹12.4L</div><div class="kpi-delta neutral">Mar 2026</div></div>
        <div class="kpi-card"><div class="kpi-label">Discrepancies Found</div><div class="kpi-value">47</div><div class="kpi-delta negative">₹1.82L overcharged</div></div>
        <div class="kpi-card"><div class="kpi-label">Amount Recovered</div><div class="kpi-value">₹1.14L</div><div class="kpi-delta positive">62.6% recovery rate</div></div>
        <div class="kpi-card"><div class="kpi-label">Pending Review</div><div class="kpi-value">₹0.68L</div><div class="kpi-delta warning">18 cases open</div></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Fee Breakdown by Type</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Fee Type</th><th>Expected</th><th>Charged</th><th>Difference</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Referral Fee</td><td class="mono">₹4.82L</td><td class="mono">₹4.87L</td><td class="mono text-warning">+₹0.05L</td><td><span class="badge badge-warning">Under Review</span></td></tr>
            <tr><td>Closing Fee</td><td class="mono">₹1.24L</td><td class="mono">₹1.24L</td><td class="mono text-success">₹0</td><td><span class="badge badge-success">Correct</span></td></tr>
            <tr><td>Weight Handling</td><td class="mono">₹2.18L</td><td class="mono">₹2.64L</td><td class="mono text-error">+₹0.46L</td><td><span class="badge badge-error">Disputed</span></td></tr>
            <tr><td>Returns Processing</td><td class="mono">₹0.88L</td><td class="mono">₹0.99L</td><td class="mono text-error">+₹0.11L</td><td><span class="badge badge-error">Disputed</span></td></tr>
            <tr><td>Storage Fee</td><td class="mono">₹1.46L</td><td class="mono">₹1.46L</td><td class="mono text-success">₹0</td><td><span class="badge badge-success">Correct</span></td></tr>
            <tr><td>Pick & Pack</td><td class="mono">₹1.62L</td><td class="mono">₹1.24L</td><td class="mono text-success">-₹0.38L</td><td><span class="badge badge-success">Credit Due</span></td></tr>
          </tbody>
        </table></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Open Dispute Log</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Case ID</th><th>Platform</th><th>Fee Type</th><th>Amount</th><th>Filed On</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td class="mono">AMA-24819</td><td><span class="badge badge-warning">Amazon</span></td><td>Weight Handling</td><td class="mono">₹0.28L</td><td>02 Mar</td><td><span class="badge badge-info">Pending</span></td></tr>
            <tr><td class="mono">FLK-18342</td><td><span class="badge badge-info">Flipkart</span></td><td>Returns Processing</td><td class="mono">₹0.11L</td><td>05 Mar</td><td><span class="badge badge-warning">In Progress</span></td></tr>
            <tr><td class="mono">AMA-24901</td><td><span class="badge badge-warning">Amazon</span></td><td>Weight Handling</td><td class="mono">₹0.18L</td><td>07 Mar</td><td><span class="badge badge-info">Pending</span></td></tr>
            <tr><td class="mono">MYN-09124</td><td><span class="badge badge-primary">Myntra</span></td><td>Referral Fee</td><td class="mono">₹0.05L</td><td>08 Mar</td><td><span class="badge badge-info">Pending</span></td></tr>
            <tr><td class="mono">MSH-04411</td><td><span class="badge badge-neutral">Meesho</span></td><td>Commission Rate</td><td class="mono">₹0.06L</td><td>09 Mar</td><td><span class="badge badge-info">Pending</span></td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  // === 12. SKU PROFITABILITY ===
  function renderSKUProfitability() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">SKUs Analyzed</div><div class="kpi-value">284</div><div class="kpi-delta neutral">Active catalogue</div></div>
        <div class="kpi-card"><div class="kpi-label">Profitable SKUs</div><div class="kpi-value">211</div><div class="kpi-delta positive">74.3% of catalogue</div></div>
        <div class="kpi-card"><div class="kpi-label">Loss-Making SKUs</div><div class="kpi-value">41</div><div class="kpi-delta negative">₹2.18L total loss</div></div>
        <div class="kpi-card"><div class="kpi-label">Avg Net Margin</div><div class="kpi-value">18.4%</div><div class="kpi-delta positive">▲ 1.2pp vs Feb</div></div>
      </div>
      <div class="chart-container">
        <div class="chart-header"><span class="chart-title">Top 8 SKUs by Net Margin</span></div>
        <div class="chart-canvas-wrap" style="height:260px"><canvas id="skuChart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">SKU Profitability Breakdown</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>SKU</th><th>Product</th><th>Revenue</th><th>COGS</th><th>Fees</th><th>Ad Cost</th><th>Net Margin</th></tr></thead>
          <tbody>
            <tr><td class="mono">TUO-PET-0112</td><td>Dog Food – 5kg Bag</td><td class="mono">₹8.4L</td><td class="mono">₹4.2L</td><td class="mono">₹0.9L</td><td class="mono">₹0.4L</td><td><span class="badge badge-success">34.5%</span></td></tr>
            <tr><td class="mono">TUO-HOM-1841</td><td>Copper Water Bottle</td><td class="mono">₹6.1L</td><td class="mono">₹2.8L</td><td class="mono">₹0.7L</td><td class="mono">₹0.3L</td><td><span class="badge badge-success">37.7%</span></td></tr>
            <tr><td class="mono">TUO-APP-2014</td><td>Linen Shirt – L</td><td class="mono">₹4.8L</td><td class="mono">₹2.4L</td><td class="mono">₹0.6L</td><td class="mono">₹0.5L</td><td><span class="badge badge-success">27.1%</span></td></tr>
            <tr><td class="mono">TUO-KIT-0881</td><td>Casserole Set – 3pc</td><td class="mono">₹3.6L</td><td class="mono">₹2.0L</td><td class="mono">₹0.4L</td><td class="mono">₹0.2L</td><td><span class="badge badge-primary">27.8%</span></td></tr>
            <tr><td class="mono">TUO-APP-1042</td><td>Cotton Kurta – M</td><td class="mono">₹2.9L</td><td class="mono">₹1.8L</td><td class="mono">₹0.5L</td><td class="mono">₹0.6L</td><td><span class="badge badge-error">0.0%</span></td></tr>
            <tr><td class="mono">TUO-PET-0338</td><td>Cat Litter – 10kg</td><td class="mono">₹2.1L</td><td class="mono">₹1.6L</td><td class="mono">₹0.4L</td><td class="mono">₹0.3L</td><td><span class="badge badge-error">-9.5%</span></td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  function initSKUChart() {
    var ctx = document.getElementById("skuChart");
    if (!ctx) return;
    state.charts.sku = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Copper Bottle","Dog Food","Linen Shirt","Casserole","Bamboo Sheet","Steel Tiffin","Pet Harness","Kurta Set"],
        datasets: [{ label: "Net Margin %", data: [37.7,34.5,27.8,27.1,22.4,19.8,12.1,0.0], backgroundColor: ["#14b8a6","#14b8a6","#14b8a6","#14b8a6","#22c55e","#22c55e","#f59e0b","#ef4444"] }]
      },
      options: { indexAxis:"y", plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ callback: function(v){ return v+"%"; } } } } }
    });
  }

  // === 13. CASH FLOW ===
  function renderCashFlow() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Opening Balance</div><div class="kpi-value">₹24.8L</div><div class="kpi-delta neutral">01 Mar 2026</div></div>
        <div class="kpi-card"><div class="kpi-label">Total Inflows</div><div class="kpi-value">₹1.84Cr</div><div class="kpi-delta positive">▲ 12.4% vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Total Outflows</div><div class="kpi-value">₹1.61Cr</div><div class="kpi-delta negative">▲ 8.1% vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Closing Balance</div><div class="kpi-value">₹47.6L</div><div class="kpi-delta positive">▲ ₹22.8L net</div></div>
      </div>
      <div class="chart-container">
        <div class="chart-header"><span class="chart-title">Monthly Cash Flow (₹L)</span></div>
        <div class="chart-canvas-wrap" style="height:260px"><canvas id="cashflowChart"></canvas></div>
      </div>
      <div class="pl-statement">
        <div class="chart-title" style="margin-bottom:var(--space-4)">Cash Flow Statement — March 2026</div>
        <div class="pl-row"><span class="pl-label" style="font-weight:600">OPERATING INFLOWS</span><span></span></div>
        <div class="pl-row pl-indent"><span class="pl-label">Marketplace Settlements</span><span class="pl-value">₹1,42,81,400</span></div>
        <div class="pl-row pl-indent"><span class="pl-label">Direct / Website Sales</span><span class="pl-value">₹28,14,200</span></div>
        <div class="pl-row pl-indent"><span class="pl-label">Returns Refund Recovery</span><span class="pl-value">₹11,40,000</span></div>
        <div class="pl-row subtotal"><span class="pl-label">Total Inflows</span><span class="pl-value">₹1,82,35,600</span></div>
        <div class="pl-row" style="margin-top:var(--space-3)"><span class="pl-label" style="font-weight:600">OPERATING OUTFLOWS</span><span></span></div>
        <div class="pl-row pl-indent"><span class="pl-label">Supplier Payments (COGS)</span><span class="pl-value">₹98,24,000</span></div>
        <div class="pl-row pl-indent"><span class="pl-label">Ad Spend</span><span class="pl-value">₹4,81,200</span></div>
        <div class="pl-row pl-indent"><span class="pl-label">Logistics & Packaging</span><span class="pl-value">₹18,42,000</span></div>
        <div class="pl-row pl-indent"><span class="pl-label">Salaries & Payroll</span><span class="pl-value">₹24,18,000</span></div>
        <div class="pl-row pl-indent"><span class="pl-label">GST / TDS Payments</span><span class="pl-value">₹14,62,000</span></div>
        <div class="pl-row pl-indent"><span class="pl-label">Platform Fees</span><span class="pl-value">₹12,40,000</span></div>
        <div class="pl-row subtotal"><span class="pl-label">Total Outflows</span><span class="pl-value">₹1,72,67,200</span></div>
        <div class="pl-row total"><span class="pl-label">Net Cash Position</span><span class="pl-value">+₹9,68,400</span></div>
      </div>`;
  }

  function initCashFlowChart() {
    var ctx = document.getElementById("cashflowChart");
    if (!ctx) return;
    var labels = ["Oct","Nov","Dec","Jan","Feb","Mar"];
    state.charts.cashflow = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Inflows", data: [148,162,198,154,163,184], backgroundColor: "rgba(34,197,94,0.7)" },
          { label: "Outflows", data: [131,148,177,141,149,161], backgroundColor: "rgba(239,68,68,0.7)" },
          { label: "Net", data: [17,14,21,13,14,23], type:"line", borderColor:"#14b8a6", backgroundColor:"transparent", pointBackgroundColor:"#14b8a6" }
        ]
      },
      options: { scales: { y:{ ticks:{ callback: function(v){ return "₹"+v+"L"; } } } }, plugins:{ legend:{ position:"top" } } }
    });
  }

  // === 14. FORECAST ===
  function renderForecast() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Projected Revenue (Apr)</div><div class="kpi-value">₹2.14Cr</div><div class="kpi-delta positive">▲ 16.3% vs Mar</div></div>
        <div class="kpi-card"><div class="kpi-label">Projected Orders</div><div class="kpi-value">24,800</div><div class="kpi-delta positive">▲ 14.1% vs Mar</div></div>
        <div class="kpi-card"><div class="kpi-label">Forecast Confidence</div><div class="kpi-value">87%</div><div class="kpi-delta positive">High accuracy</div></div>
        <div class="kpi-card"><div class="kpi-label">Inventory Coverage</div><div class="kpi-value">38 days</div><div class="kpi-delta warning">Restock 12 SKUs</div></div>
      </div>
      <div class="chart-container">
        <div class="chart-header"><span class="chart-title">Revenue Forecast vs Actuals (₹L)</span></div>
        <div class="chart-canvas-wrap" style="height:260px"><canvas id="forecastChart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">SKU-Level Demand Forecast — April 2026</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>SKU</th><th>Product</th><th>Forecasted Units</th><th>Current Stock</th><th>Cover Days</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td class="mono">TUO-PET-0112</td><td>Dog Food – 5kg</td><td class="mono">1,840</td><td class="mono">1,200</td><td><span class="badge badge-error">21 days</span></td><td><button class="action-btn">Reorder</button></td></tr>
            <tr><td class="mono">TUO-HOM-1841</td><td>Copper Bottle</td><td class="mono">1,240</td><td class="mono">1,800</td><td><span class="badge badge-success">44 days</span></td><td><button class="action-btn">Monitor</button></td></tr>
            <tr><td class="mono">TUO-APP-2014</td><td>Linen Shirt – L</td><td class="mono">980</td><td class="mono">540</td><td><span class="badge badge-warning">17 days</span></td><td><button class="action-btn">Reorder</button></td></tr>
            <tr><td class="mono">TUO-KIT-0881</td><td>Casserole Set</td><td class="mono">760</td><td class="mono">1,100</td><td><span class="badge badge-success">44 days</span></td><td><button class="action-btn">Monitor</button></td></tr>
            <tr><td class="mono">TUO-PET-0338</td><td>Cat Litter – 10kg</td><td class="mono">680</td><td class="mono">220</td><td><span class="badge badge-error">10 days</span></td><td><button class="action-btn">Urgent</button></td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  function initForecastChart() {
    var ctx = document.getElementById("forecastChart");
    if (!ctx) return;
    var labels = ["Oct","Nov","Dec","Jan","Feb","Mar","Apr*","May*","Jun*"];
    state.charts.forecast = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Actual", data: [148,162,198,154,163,184,null,null,null], borderColor:"#14b8a6", backgroundColor:"rgba(20,184,166,0.1)", fill:true, pointBackgroundColor:"#14b8a6" },
          { label: "Forecast", data: [null,null,null,null,null,184,214,228,241], borderColor:"#6366f1", backgroundColor:"rgba(99,102,241,0.08)", fill:true, borderDash:[5,5], pointBackgroundColor:"#6366f1" },
          { label: "Upper Band", data: [null,null,null,null,null,null,228,244,259], borderColor:"rgba(99,102,241,0.3)", borderDash:[3,3], pointRadius:0, fill:false },
          { label: "Lower Band", data: [null,null,null,null,null,null,200,212,223], borderColor:"rgba(99,102,241,0.3)", borderDash:[3,3], pointRadius:0, fill:false }
        ]
      },
      options: { plugins:{ legend:{ position:"top" } }, scales:{ y:{ ticks:{ callback: function(v){ return "₹"+v+"L"; } } } } }
    });
  }

  // === 15. COMPLIANCE ===
  function renderCompliance() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Compliance Score</div><div class="kpi-value">91/100</div><div class="kpi-delta positive">▲ 3pts vs Feb</div></div>
        <div class="kpi-card"><div class="kpi-label">Filings Due (Apr)</div><div class="kpi-value">8</div><div class="kpi-delta neutral">Next: GSTR-1 on 11 Apr</div></div>
        <div class="kpi-card"><div class="kpi-label">Overdue</div><div class="kpi-value">0</div><div class="kpi-delta positive">All clear</div></div>
        <div class="kpi-card"><div class="kpi-label">Completed YTD</div><div class="kpi-value">34</div><div class="kpi-delta positive">100% on-time rate</div></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Compliance Calendar — April 2026</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Filing</th><th>Period</th><th>Due Date</th><th>Entity</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>GSTR-1</td><td>Mar 2026</td><td>11 Apr 2026</td><td>Tuoraa Pvt Ltd</td><td><span class="badge badge-warning">Pending</span></td></tr>
            <tr><td>GSTR-3B</td><td>Mar 2026</td><td>20 Apr 2026</td><td>Tuoraa Pvt Ltd</td><td><span class="badge badge-warning">Pending</span></td></tr>
            <tr><td>TDS Return (24Q)</td><td>Q4 FY26</td><td>30 Apr 2026</td><td>Tuoraa Pvt Ltd</td><td><span class="badge badge-info">Prep in Progress</span></td></tr>
            <tr><td>Advance Tax</td><td>Q4 FY26</td><td>15 Mar 2026</td><td>Tuoraa Pvt Ltd</td><td><span class="badge badge-success">Filed</span></td></tr>
            <tr><td>GSTR-1</td><td>Feb 2026</td><td>11 Mar 2026</td><td>Tuoraa – Punjab</td><td><span class="badge badge-success">Filed</span></td></tr>
            <tr><td>GSTR-3B</td><td>Feb 2026</td><td>20 Mar 2026</td><td>Tuoraa – Punjab</td><td><span class="badge badge-success">Filed</span></td></tr>
            <tr><td>EPF / ESIC</td><td>Mar 2026</td><td>25 Apr 2026</td><td>All Entities</td><td><span class="badge badge-neutral">Upcoming</span></td></tr>
            <tr><td>ROC Annual Filing</td><td>FY 2025-26</td><td>30 Sep 2026</td><td>Tuoraa Pvt Ltd</td><td><span class="badge badge-neutral">Upcoming</span></td></tr>
          </tbody>
        </table></div>
      </div>
      <div class="action-items">
        <div class="chart-title" style="margin-bottom:var(--space-3)">Action Required</div>
        <div class="action-item"><div class="action-dot"></div><span class="action-text">Reconcile GSTR-2B vs Books before GSTR-3B filing (by 18 Apr)</span><button class="action-btn">Start</button></div>
        <div class="action-item"><div class="action-dot"></div><span class="action-text">Compile Form 16 data for all employees — FY 2025-26</span><button class="action-btn">Start</button></div>
        <div class="action-item"><div class="action-dot" style="background:var(--color-info)"></div><span class="action-text">Upload GSTR-1 purchase register for March — data ready</span><button class="action-btn">Upload</button></div>
      </div>`;
  }

  // === 16. INVENTORY ===
  function renderInventory() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Active SKUs</div><div class="kpi-value">284</div><div class="kpi-delta neutral">Across 3 warehouses</div></div>
        <div class="kpi-card"><div class="kpi-label">In Stock</div><div class="kpi-value">231</div><div class="kpi-delta positive">81.3% availability</div></div>
        <div class="kpi-card"><div class="kpi-label">Low Stock (≤30 days)</div><div class="kpi-value">38</div><div class="kpi-delta negative">Restock needed</div></div>
        <div class="kpi-card"><div class="kpi-label">Out of Stock</div><div class="kpi-value">15</div><div class="kpi-delta negative">₹3.8L lost opportunity</div></div>
      </div>
      <div class="chart-container">
        <div class="chart-header"><span class="chart-title">Inventory by Warehouse</span></div>
        <div class="chart-canvas-wrap" style="height:240px"><canvas id="inventoryChart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Low Stock Alerts</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>SKU</th><th>Product</th><th>Current Stock</th><th>Avg Daily Sales</th><th>Cover Days</th><th>Lead Time</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td class="mono">TUO-PET-0338</td><td>Cat Litter – 10kg</td><td class="mono">220</td><td class="mono">22</td><td><span class="badge badge-error">10 days</span></td><td>14 days</td><td><button class="action-btn">Reorder Now</button></td></tr>
            <tr><td class="mono">TUO-APP-2014</td><td>Linen Shirt – L</td><td class="mono">540</td><td class="mono">32</td><td><span class="badge badge-error">17 days</span></td><td>21 days</td><td><button class="action-btn">Reorder Now</button></td></tr>
            <tr><td class="mono">TUO-PET-0112</td><td>Dog Food – 5kg</td><td class="mono">1200</td><td class="mono">57</td><td><span class="badge badge-warning">21 days</span></td><td>14 days</td><td><button class="action-btn">Plan Reorder</button></td></tr>
            <tr><td class="mono">TUO-HOM-2291</td><td>Bamboo Bedsheet</td><td class="mono">380</td><td class="mono">18</td><td><span class="badge badge-warning">21 days</span></td><td>28 days</td><td><button class="action-btn">Plan Reorder</button></td></tr>
            <tr><td class="mono">TUO-KIT-0774</td><td>Stainless Tiffin</td><td class="mono">640</td><td class="mono">24</td><td><span class="badge badge-warning">27 days</span></td><td>21 days</td><td><button class="action-btn">Plan Reorder</button></td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  function initInventoryChart() {
    var ctx = document.getElementById("inventoryChart");
    if (!ctx) return;
    state.charts.inventory = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Delhi (WH1)","Mumbai (WH2)","Bengaluru (WH3)"],
        datasets: [{ data: [42, 31, 27], backgroundColor: ["#14b8a6","#6366f1","#f59e0b"], borderWidth: 0 }]
      },
      options: { plugins:{ legend:{ position:"right" } } }
    });
  }

  // === 17. BANK RECON ===
  function renderBankRecon() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Transactions (Mar)</div><div class="kpi-value">1,284</div><div class="kpi-delta neutral">All bank accounts</div></div>
        <div class="kpi-card"><div class="kpi-label">Auto-Matched</div><div class="kpi-value">1,198</div><div class="kpi-delta positive">93.3% match rate</div></div>
        <div class="kpi-card"><div class="kpi-label">Unmatched</div><div class="kpi-value">86</div><div class="kpi-delta negative">Needs review</div></div>
        <div class="kpi-card"><div class="kpi-label">Unmatched Value</div><div class="kpi-value">₹4.18L</div><div class="kpi-delta negative">Pending clearance</div></div>
      </div>
      <div class="sync-bar" style="margin-bottom:var(--space-6)">
        <span style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary);margin-right:var(--space-2)">BANK ACCOUNTS</span>
        <span class="sync-item"><span class="sync-dot connected"></span><span class="sync-label">HDFC Current A/c …4821</span> — Last synced 10 Mar 10:42</span>
        <span class="sync-item"><span class="sync-dot connected"></span><span class="sync-label">ICICI A/c …7734</span> — Last synced 10 Mar 10:42</span>
        <span class="sync-item"><span class="sync-dot syncing"></span><span class="sync-label">Kotak A/c …2219</span> — Syncing…</span>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Unmatched Transactions</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Date</th><th>Bank</th><th>Description</th><th>Amount</th><th>Type</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td>07 Mar</td><td>HDFC …4821</td><td>NEFT/TUO-AMZ-84421</td><td class="mono text-success">+₹84,200</td><td><span class="badge badge-info">Credit</span></td><td><button class="action-btn">Match</button></td></tr>
            <tr><td>07 Mar</td><td>HDFC …4821</td><td>UPI/SUPPLIER-PAHWA</td><td class="mono text-error">−₹62,000</td><td><span class="badge badge-warning">Debit</span></td><td><button class="action-btn">Match</button></td></tr>
            <tr><td>08 Mar</td><td>ICICI …7734</td><td>IMPS/FLK-SETTLE-0338</td><td class="mono text-success">+₹1,14,800</td><td><span class="badge badge-info">Credit</span></td><td><button class="action-btn">Match</button></td></tr>
            <tr><td>09 Mar</td><td>HDFC …4821</td><td>CHQ/LOGISTICS-DELHIVERY</td><td class="mono text-error">−₹41,400</td><td><span class="badge badge-warning">Debit</span></td><td><button class="action-btn">Match</button></td></tr>
            <tr><td>10 Mar</td><td>ICICI …7734</td><td>NEFT/UNKNOWN-REMI-2291</td><td class="mono text-success">+₹28,600</td><td><span class="badge badge-error">Unknown</span></td><td><button class="action-btn">Investigate</button></td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  // === 18. PAYROLL ===
  function renderPayroll() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Employees</div><div class="kpi-value">48</div><div class="kpi-delta neutral">Mar 2026 headcount</div></div>
        <div class="kpi-card"><div class="kpi-label">Gross Payroll</div><div class="kpi-value">₹28.4L</div><div class="kpi-delta neutral">Mar 2026</div></div>
        <div class="kpi-card"><div class="kpi-label">PF Liability</div><div class="kpi-value">₹2.42L</div><div class="kpi-delta neutral">Due 15 Apr</div></div>
        <div class="kpi-card"><div class="kpi-label">TDS Deducted</div><div class="kpi-value">₹1.86L</div><div class="kpi-delta neutral">To be remitted</div></div>
      </div>
      <div class="chart-container">
        <div class="chart-header"><span class="chart-title">Monthly Payroll Trend (₹L)</span></div>
        <div class="chart-canvas-wrap" style="height:220px"><canvas id="payrollChart"></canvas></div>
      </div>
      <div class="table-container">
        <div class="table-header"><span class="table-title">Salary Register — March 2026</span></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Department</th><th>Headcount</th><th>Gross Salary</th><th>PF (Employer)</th><th>TDS</th><th>Net Payable</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Operations</td><td class="mono">18</td><td class="mono">₹9.84L</td><td class="mono">₹0.84L</td><td class="mono">₹0.42L</td><td class="mono">₹8.58L</td><td><span class="badge badge-success">Paid</span></td></tr>
            <tr><td>Sales & Marketing</td><td class="mono">10</td><td class="mono">₹7.20L</td><td class="mono">₹0.62L</td><td class="mono">₹0.64L</td><td class="mono">₹5.94L</td><td><span class="badge badge-success">Paid</span></td></tr>
            <tr><td>Technology</td><td class="mono">8</td><td class="mono">₹6.40L</td><td class="mono">₹0.54L</td><td class="mono">₹0.44L</td><td class="mono">₹5.42L</td><td><span class="badge badge-success">Paid</span></td></tr>
            <tr><td>Finance & Accounts</td><td class="mono">6</td><td class="mono">₹3.12L</td><td class="mono">₹0.27L</td><td class="mono">₹0.22L</td><td class="mono">₹2.63L</td><td><span class="badge badge-warning">Processing</span></td></tr>
            <tr><td>Warehouse & Logistics</td><td class="mono">6</td><td class="mono">₹1.84L</td><td class="mono">₹0.15L</td><td class="mono">₹0.14L</td><td class="mono">₹1.55L</td><td><span class="badge badge-warning">Processing</span></td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  function initPayrollChart() {
    var ctx = document.getElementById("payrollChart");
    if (!ctx) return;
    var labels = ["Oct","Nov","Dec","Jan","Feb","Mar"];
    state.charts.payroll = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Gross Payroll", data: [24.2,24.8,26.1,25.4,26.8,28.4], backgroundColor: "#6366f1" },
          { label: "PF + TDS", data: [3.8,3.9,4.1,4.0,4.2,4.28], backgroundColor: "#f59e0b" }
        ]
      },
      options: { scales:{ x:{ stacked:false }, y:{ ticks:{ callback: function(v){ return "₹"+v+"L"; } } } }, plugins:{ legend:{ position:"top" } } }
    });
  }

  // ── SECTION MAP ──
  var sectionRenderers = {
    overview: renderOverview,
    sales: renderSales,
    returns: renderReturns,
    adspend: renderAdSpend,
    settlements: renderSettlements,
    feeaudit: renderFeeAudit,
    pl: renderPL,
    skuprofitability: renderSKUProfitability,
    cashflow: renderCashFlow,
    forecast: renderForecast,
    gst: renderGST,
    "tcs-tds": renderTCSTDS,
    compliance: renderCompliance,
    inventory: renderInventory,
    stock: renderStock,
    tally: renderTally,
    bankrecon: renderBankRecon,
    payroll: renderPayroll,
  };

  var sectionInits = {
    overview: initOverviewChart,
    sales: initSalesChart,
    returns: initReturnsChart,
    adspend: initAdSpendChart,
    settlements: initWaterfallChart,
    skuprofitability: initSKUChart,
    cashflow: initCashFlowChart,
    forecast: initForecastChart,
    inventory: initInventoryChart,
    "tcs-tds": initTCSCharts,
    pl: initPLCharts,
    payroll: initPayrollChart,
  };

  // ── ROUTING ──
  function destroyCharts() {
    Object.keys(state.charts).forEach(function (key) {
      if (state.charts[key]) {
        state.charts[key].destroy();
        delete state.charts[key];
      }
    });
  }

  function navigate(section) {
    if (!sectionRenderers[section]) section = "overview";
    state.currentSection = section;

    // Update nav
    document.querySelectorAll(".nav-item").forEach(function (el) {
      el.classList.toggle("active", el.dataset.section === section);
    });

    // Update header
    document.getElementById("headerTitle").textContent =
      sectionTitles[section] || "Overview";

    // Destroy old charts
    destroyCharts();

    // Render section
    var main = document.getElementById("mainContent");
    main.innerHTML =
      '<div class="section-view active">' +
      sectionRenderers[section]() +
      "</div>";
    main.scrollTop = 0;

    // Init charts
    if (sectionInits[section]) {
      requestAnimationFrame(function () {
        sectionInits[section]();
      });
    }

    // Close sidebar on mobile
    closeSidebar();
  }

  function handleHash() {
    var hash = window.location.hash.replace("#", "") || "overview";
    navigate(hash);
  }

  // ── SIDEBAR MOBILE ──
  function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("open");
  }

  function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("open");
  }

  // ── THEME TOGGLE ──
  function toggleTheme() {
    var html = document.documentElement;
    var newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    state.theme = newTheme;

    // Update chart defaults
    var textColor = newTheme === "dark" ? "#94a3b8" : "#475569";
    var gridColor =
      newTheme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
    Chart.defaults.color = textColor;

    // Re-render current section to pick up new theme
    navigate(state.currentSection);

    // Update toggle icon
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    var btn = document.getElementById("themeToggle");
    if (theme === "light") {
      btn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    } else {
      btn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    }
  }

  // ── INIT ──
  function init() {
    // Sidebar nav clicks
    document.querySelectorAll(".nav-item").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var section = this.dataset.section;
        window.location.hash = section;
      });
    });

    // Hamburger
    document
      .getElementById("hamburger")
      .addEventListener("click", openSidebar);
    document
      .getElementById("sidebarOverlay")
      .addEventListener("click", closeSidebar);

    // Theme toggle
    document
      .getElementById("themeToggle")
      .addEventListener("click", toggleTheme);

    // Hash routing
    window.addEventListener("hashchange", handleHash);
    handleHash();
  }

  // Start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
