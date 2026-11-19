// Ported locked markup; presentation values are supplied by ledgerApi.
const markup = `
  <!-- Executive Top Bar -->
  <header class="app-header">
    <div class="header-inner">
      <a href="#/overview" class="brand-group">
        <img src="assets/oryan-logo.png" alt="O'Ryan Logo" class="brand-logo-img">
        <div class="brand-text">
          <span class="brand-name">O’Ryan Event Center</span>
          <span class="brand-tagline">{{v0}}</span>
        </div>
      </a>
      <nav class="nav-tabs">
        <a href="#/overview" class="nav-link" data-label="Overview">Overview</a>
        <a href="#/bookings" class="nav-link" data-label="Bookings">Bookings</a>
        <a href="#/calendar" class="nav-link" data-label="Calendar">Calendar</a>
        <a href="#/payments" class="nav-link" data-label="Payments">Payments</a>
        <a href="#/insights" class="nav-link" data-label="Insights">Insights</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
        <a href="#/overview" class="btn btn-quiet btn-sm">&larr; Overview</a>
      </div>
    </div>
  </header>

  <!-- Mobile Top Bar -->
  <div class="mobile-top-bar">
    <a href="#/overview" class="brand-group">
      <img src="assets/oryan-logo.png" alt="O'Ryan" class="brand-logo-img" style="height: 32px;">
      <span class="brand-name" style="font-size: 14px;">Edge States</span>
    </a>
    <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
  </div>

  <main class="main-content">
    <div class="page-header">
      <div class="page-title-group">
        <h1>UI Edge States &amp; Variations Showcase</h1>
        <p class="page-description">{{v1}}</p>
      </div>
    </div>

    <!-- STATE 1: ERROR BANNER WITH RETRY -->
    <div class="state-section">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: var(--space-3); color: var(--accent);">{{v2}}</h3>
      <div class="alert alert-danger" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); padding: var(--space-4);">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <svg class="icon" viewBox="0 0 24 24" style="width: 24px; height: 24px; flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <strong>Unable to sync latest transaction journal from server.</strong>
            <p style="font-size: 12px; margin-top: 2px;">{{v3}}</p>
          </div>
        </div>
        <button type="button" class="btn btn-quiet btn-sm" data-action="states-0">
          Try again
        </button>
      </div>
    </div>

    <!-- STATE 2: OFFLINE INDICATOR -->
    <div class="state-section">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: var(--space-3); color: var(--accent);">{{v4}}</h3>
      <div class="alert alert-warning" style="display: flex; align-items: center; gap: var(--space-3);">
        <svg class="icon" viewBox="0 0 24 24" style="width: 20px; height: 20px; flex-shrink: 0;"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        <div>
          <strong>Offline Mode Active:</strong> You are currently disconnected. Reconnect to reload the ledger.
        </div>
      </div>
    </div>

    <!-- STATE 3: LOADING SKELETON STATE -->
    <div class="state-section">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: var(--space-3); color: var(--accent);">{{v5}}</h3>
      <div class="card" style="padding: var(--space-5);">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-line" style="width: 80%;"></div>
        <div class="skeleton skeleton-line" style="width: 65%;"></div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px;">
          <div class="skeleton" style="height: 64px;"></div>
          <div class="skeleton" style="height: 64px;"></div>
          <div class="skeleton" style="height: 64px;"></div>
        </div>
      </div>
    </div>

    <!-- STATE 4: EMPTY STATE (NO SEARCH RESULTS) -->
    <div class="state-section">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: var(--space-3); color: var(--accent);">{{v6}}</h3>
      <div class="card" style="text-align: center; padding: var(--space-10) var(--space-4);">
        <svg class="icon" viewBox="0 0 24 24" style="width: 44px; height: 44px; color: var(--muted); margin-bottom: var(--space-3);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text);">No bookings found matching your search</h4>
        <p style="font-size: 13px; color: var(--muted); max-width: 380px; margin: 6px auto var(--space-4);">
          No reservations found for "XYZ-nonexistent". Check your spelling or clear your active filter chips.
        </p>
        <button type="button" class="btn btn-quiet btn-sm">Reset search filters</button>
      </div>
    </div>

    <!-- STATE 5: SETTLED & CANCELLED BOOKING LOOKS -->
    <div class="state-section">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: var(--space-3); color: var(--accent);">{{v7}}</h3>
      <div class="ledger-table-wrap">
        <table class="ledger-table bookings-table">
          <tbody>
            <!-- Settled row -->
            <tr class="ledger-row">
              <td>
                <div class="date-block" style="background-color: var(--settled-bg);">
                  <span class="date-block-month">Oct</span>
                  <span class="date-block-day">{{v8}}</span>
                </div>
              </td>
              <td>
                <div class="guest-info">
                  <h4>{{v9}}</h4>
                  <p>{{v10}}</p>
                </div>
              </td>
              <td class="financial-cell" style="text-align: right;">{{v11}}</td>
              <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v12}}</td>
              <td class="financial-cell" style="text-align: right;">
                <span class="badge badge-settled">Settled &middot; Archived</span>
              </td>
              <td style="text-align: right;">
                <button type="button" class="btn btn-quiet btn-sm">Details</button>
              </td>
            </tr>

            <!-- Cancelled row with fee -->
            <tr class="ledger-row" style="opacity: 0.85;">
              <td>
                <div class="date-block" style="background-color: var(--cancelled-bg);">
                  <span class="date-block-month">Apr</span>
                  <span class="date-block-day">{{v13}}</span>
                </div>
              </td>
              <td>
                <div class="guest-info">
                  <h4 style="text-decoration: line-through;">Aria &amp; Noah Kim Wedding</h4>
                  <p>{{v14}}</p>
                </div>
              </td>
              <td class="financial-cell" style="text-align: right; text-decoration: line-through; color: var(--muted);">{{v15}}</td>
              <td class="financial-cell" style="text-align: right;">{{v16}}</td>
              <td class="financial-cell" style="text-align: right;">
                <span class="badge badge-cancelled">Cancelled</span>
              </td>
              <td style="text-align: right;">
                <button type="button" class="btn btn-quiet btn-sm">Restore</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- STATE 6: LONG NAMES & EXTREME TEXT WRAP -->
    <div class="state-section">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: var(--space-3); color: var(--accent);">{{v17}}</h3>
      <div class="card" style="padding: var(--space-4);">
        <div style="display: flex; gap: 8px; margin-bottom: 6px;">
          <span class="badge badge-due">{{v18}}</span>
          <span class="badge badge-overdue">Overdue</span>
        </div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text); overflow-wrap: anywhere; line-height: 1.3;">
          Dr. Alexander Bartholomew Montgomery-Fitzgerald III &amp; The Honorable Archduchess Penelope Anastasia Winterbourne-Kensington of St. Paul
        </h4>
        <p style="font-size: 12px; color: var(--muted); margin-top: 4px; overflow-wrap: anywhere;">{{v19}}</p>
        <p style="font-size: 12px; margin-top: 8px; line-height: 1.6; background-color: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); overflow-wrap: anywhere;">
          <strong>Special client notes:</strong>{{v20}}</p>
      </div>
    </div>

    <!-- STATE 7: MANY EXTRAS (10 TOTAL EXTRAS BREAKDOWN) -->
    <div class="state-section">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: var(--space-3); color: var(--accent);">{{v21}}</h3>
      <div class="card">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">{{v22}}</h4>
        <p style="font-size: 12px; color: var(--muted); margin-bottom: var(--space-3);">{{v23}}</p>

        <table class="breakdown-table">
          <tbody>
            <tr><td>Hall Base Rental</td><td>{{v24}}</td></tr>
            <tr><td>{{v25}}</td><td>{{v26}}</td></tr>
            <tr><td>{{v27}}</td><td>{{v28}}</td></tr>
            <tr><td>{{v29}}</td><td>{{v30}}</td></tr>
            <tr><td>{{v31}}</td><td>{{v32}}</td></tr>
            <tr><td>{{v33}}</td><td>{{v34}}</td></tr>
            <tr><td>{{v35}}</td><td>{{v36}}</td></tr>
            <tr><td>{{v37}}</td><td>{{v38}}</td></tr>
            <tr><td>{{v39}}</td><td>{{v40}}</td></tr>
            <tr><td>{{v41}}</td><td>{{v42}}</td></tr>
            <tr><td>{{v43}}</td><td>{{v44}}</td></tr>
            <tr style="color: var(--success-text);"><td>Early Booking Incentive Discount</td><td>{{v45}}</td></tr>
            <tr class="breakdown-total-row"><td>Total Agreed Price</td><td>{{v46}}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- STATE 8: VERY LARGE AMOUNT ($1,250,000.00) -->
    <div class="state-section">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: var(--space-3); color: var(--accent);">{{v47}}</h3>
      <div class="card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4);">
        <div>
          <span class="badge badge-due">Multi-Season Venue Agreement</span>
          <h4 style="font-size: 18px; font-weight: 800; color: var(--text); margin-top: 4px;">{{v48}}</h4>
          <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">{{v49}}</p>
        </div>
        <div class="amount-block" style="text-align: right;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px;">Remaining Balance Due</div>
          <div style="font-size: 32px; font-weight: 800; color: var(--warning-text); font-family: var(--font-mono);">{{v50}}</div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">
            Agreed total: <strong>{{v51}}</strong> &middot; Paid: <strong style="color: var(--success-text);">{{v52}}</strong>
          </div>
        </div>
      </div>
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
    /* Skeleton Shimmer Animation */
    .skeleton {
      background: linear-gradient(90deg, var(--surface-hover) 25%, var(--line) 50%, var(--surface-hover) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.6s infinite ease-in-out;
      border-radius: var(--radius-xs);
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton-line {
      height: 14px;
      margin-bottom: 8px;
    }
    .skeleton-title {
      height: 22px;
      width: 60%;
      margin-bottom: 12px;
    }
    .state-section {
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-6);
      border-bottom: 1px dashed var(--line);
    }
    .state-section:last-child {
      border-bottom: none;
    }
  `;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
