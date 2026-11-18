// Ported locked markup; presentation values are supplied by ledgerApi.
const markup = `
  <!-- Executive Top Bar -->
  <header class="app-header">
    <div class="header-inner">
      <a href="#/bookings" class="brand-group">
        <img src="assets/oryan-logo.png" alt="O'Ryan Logo" class="brand-logo-img">
        <div class="brand-text">
          <span class="brand-name">O’Ryan Event Center</span>
          <span class="brand-tagline">{{v0}}</span>
        </div>
      </a>
      <nav class="nav-tabs">
        <a href="#/overview" class="nav-link">Overview</a>
        <a href="#/bookings" class="nav-link">Bookings</a>
        <a href="#/calendar" class="nav-link">Calendar</a>
        <a href="#/payments" class="nav-link">Payments</a>
        <a href="#/insights" class="nav-link active">Insights</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
        <a href="#/new" class="btn btn-primary btn-sm">+ New booking</a>
      </div>
    </div>
  </header>

  <!-- Mobile Top Bar -->
  <div class="mobile-top-bar">
    <a href="#/bookings" class="brand-group">
      <img src="assets/oryan-logo.png" alt="O'Ryan" class="brand-logo-img" style="height: 32px;">
      <span class="brand-name" style="font-size: 14px;">Insights</span>
    </a>
    <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
  </div>

  <main class="main-content">
    <div class="page-header">
      <div class="page-title-group">
        <h1>Yearly Insights &amp; Ledger Trends</h1>
        <p class="page-description">Separate fictional annual cohort &middot; Monthly value, booking counts, and celebration mix.</p>
      </div>
      <div class="page-actions">
        <select class="select-box" aria-label="Select year for insights">
          <option value="{{v30}}" selected>{{v1}}</option>
          <option value="{{v31}}">{{v2}}</option>
          <option value="{{v32}}">All-time overview</option>
        </select>
      </div>
    </div>

    <!-- 3 Yearly Numbers -->
    <div class="overview-stats">
      <div class="stat-item">
        <div class="stat-label">{{v3}}</div>
        <div class="stat-value" style="color: var(--accent);">{{v4}}</div>
        <div class="stat-note">{{v5}}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Total payments collected</div>
        <div class="stat-value" style="color: var(--success-text);">{{v6}}</div>
        <div class="stat-note">{{v7}}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Outstanding balance</div>
        <div class="stat-value" style="color: var(--warning-text);">{{v8}}</div>
        <div class="stat-note">Scheduled for collection prior to events</div>
      </div>
    </div>

    <!-- The One Restrained Chart Visual (CSS-only monthly bars) -->
    <section class="card" style="margin-bottom: var(--space-6);">
      <div class="card-header">
        <div>
          <h2 class="card-title">{{v9}}</h2>
          <p class="card-subtitle">Monthly venue charges and booking concentration</p>
        </div>
        <span class="badge badge-due">{{v10}}</span>
      </div>

      <div class="v-chart" aria-label="Bar chart showing monthly event totals for 2026">
        <div class="v-bar-col">
          <span class="v-bar-val">{{v11}}</span>
          <div class="v-bar" style="height: 34%;"></div>
          <span class="v-bar-label">Jan</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v12}}</span>
          <div class="v-bar" style="height: 48%;"></div>
          <span class="v-bar-label">Feb</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v13}}</span>
          <div class="v-bar" style="height: 54%;"></div>
          <span class="v-bar-label">Mar</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v14}}</span>
          <div class="v-bar" style="height: 72%;"></div>
          <span class="v-bar-label">Apr</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v15}}</span>
          <div class="v-bar" style="height: 94%;"></div>
          <span class="v-bar-label">May</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v16}}</span>
          <div class="v-bar peak" style="height: 100%;"></div>
          <span class="v-bar-label" style="color: var(--accent); font-weight: 700;">Jun</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v17}}</span>
          <div class="v-bar" style="height: 76%;"></div>
          <span class="v-bar-label">Jul</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v18}}</span>
          <div class="v-bar" style="height: 86%;"></div>
          <span class="v-bar-label">Aug</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v19}}</span>
          <div class="v-bar" style="height: 69%;"></div>
          <span class="v-bar-label">Sep</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v20}}</span>
          <div class="v-bar" style="height: 78%;"></div>
          <span class="v-bar-label">Oct</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v21}}</span>
          <div class="v-bar" style="height: 89%;"></div>
          <span class="v-bar-label" style="font-weight: 700;">Nov</span>
        </div>
        <div class="v-bar-col">
          <span class="v-bar-val">{{v22}}</span>
          <div class="v-bar" style="height: 83%;"></div>
          <span class="v-bar-label">Dec</span>
        </div>
      </div>
    </section>

    <!-- Two-column Detail Mix -->
    <div class="insights-bottom-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
      <!-- Celebration Mix -->
      <section class="card">
        <h3 class="card-title" style="margin-bottom: var(--space-3);">Celebration Type Mix</h3>
        <p class="card-subtitle" style="margin-bottom: var(--space-4);">Share of annual booking count</p>

        <div class="bar-chart-container">
          <div class="bar-row">
            <span>Wedding</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: 42%;"></div>
            </div>
            <span class="bar-value">{{v23}}</span>
          </div>

          <div class="bar-row">
            <span>Birthday</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: 28%;"></div>
            </div>
            <span class="bar-value">{{v24}}</span>
          </div>

          <div class="bar-row">
            <span>Business</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: 18%;"></div>
            </div>
            <span class="bar-value">{{v25}}</span>
          </div>

          <div class="bar-row">
            <span>Other</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: 12%;"></div>
            </div>
            <span class="bar-value">{{v26}}</span>
          </div>
        </div>
      </section>

      <!-- Popular Days -->
      <section class="card">
        <h3 class="card-title" style="margin-bottom: var(--space-3);">Day of the Week Demand</h3>
        <p class="card-subtitle" style="margin-bottom: var(--space-4);">Which celebration days do clients book?</p>

        <div class="bar-chart-container">
          <div class="bar-row">
            <span style="font-weight: 700; color: var(--accent);">Saturday</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: 72%;"></div>
            </div>
            <span class="bar-value" style="color: var(--accent);">{{v27}}</span>
          </div>

          <div class="bar-row">
            <span>Friday</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: 20%;"></div>
            </div>
            <span class="bar-value">{{v28}}</span>
          </div>

          <div class="bar-row">
            <span>Sunday</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: 8%;"></div>
            </div>
            <span class="bar-value">{{v29}}</span>
          </div>
        </div>

        <div class="alert alert-info" style="margin-top: var(--space-4);">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            <strong>Key Venue Takeaway:</strong>
            Saturdays remain your highest-demand premium night. Consider bundling Friday afternoon setup with Saturday bookings.
          </div>
        </div>
      </section>
    </div>
  </main>

  <!-- Mobile Bottom Nav -->
  <nav class="mobile-bottom-bar">
    <div class="mobile-nav-items">
      <a href="#/overview" class="mobile-nav-link">
        <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
        <span>Overview</span>
      </a>
      <a href="#/bookings" class="mobile-nav-link">
        <svg class="icon" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        <span>Bookings</span>
      </a>
      <a href="#/new" class="mobile-nav-link quick-add" aria-label="New booking">
        <div class="mobile-add-btn">
          <svg class="icon" viewBox="0 0 24 24" style="stroke-width: 2.5;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <span style="margin-top: 2px;" aria-hidden="true">Add</span>
      </a>
      <a href="#/calendar" class="mobile-nav-link">
        <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Calendar</span>
      </a>
      <a href="#/payments" class="mobile-nav-link">
        <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        <span>Payments</span>
      </a>
    </div>
  </nav>

  `;
export const styles = `
    .v-chart {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      height: 220px;
      padding: var(--space-4) 0 var(--space-2);
      border-bottom: 2px solid var(--line);
      margin-top: var(--space-4);
    }
    .v-bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      gap: 6px;
    }
    .v-bar {
      width: 100%;
      max-width: 38px;
      background-color: var(--accent-surface-border);
      border-radius: var(--radius-xs) var(--radius-xs) 0 0;
      transition: height var(--transition-normal);
      min-height: 4px;
    }
    .v-bar.peak {
      background-color: var(--accent);
    }
    .v-bar-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
    }
    .v-bar-val {
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--muted);
    }
    @media (max-width: 768px) {
      .insights-bottom-grid {
        grid-template-columns: 1fr !important;
      }
      .v-chart {
        gap: 3px;
        height: 140px;
        padding-top: var(--space-2);
      }
      .v-bar-col {
        min-width: 0;
        gap: 2px;
      }
      .v-bar {
        max-width: 16px;
      }
      .v-bar-label {
        font-size: 8px;
      }
      .v-bar-val {
        display: none;
      }
    }
    @media (max-width: 360px) {
      .v-chart {
        gap: 2px;
      }
      .v-bar {
        max-width: 12px;
      }
    }
  `;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
