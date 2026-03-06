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
    settlements: "Settlement Reconciliation",
    gst: "GST Command Center",
    "tcs-tds": "TCS / TDS Tracker",
    stock: "Stock Transfers",
    tally: "Tally Sync",
    pl: "Profit & Loss",
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
          <option>Refit Animal Care Pvt Ltd</option>
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

  // ── SECTION MAP ──
  var sectionRenderers = {
    overview: renderOverview,
    sales: renderSales,
    settlements: renderSettlements,
    gst: renderGST,
    "tcs-tds": renderTCSTDS,
    stock: renderStock,
    tally: renderTally,
    pl: renderPL,
  };

  var sectionInits = {
    overview: initOverviewChart,
    sales: initSalesChart,
    settlements: initWaterfallChart,
    "tcs-tds": initTCSCharts,
    pl: initPLCharts,
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
