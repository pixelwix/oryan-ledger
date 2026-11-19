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
        <a href="#/overview" class="nav-link active" data-label="Overview">Overview</a>
        <a href="#/bookings" class="nav-link" data-label="Bookings">Bookings</a>
        <a href="#/calendar" class="nav-link" data-label="Calendar">Calendar</a>
        <a href="#/payments" class="nav-link" data-label="Payments">Payments</a>
        <a href="#/insights" class="nav-link" data-label="Insights">Insights</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
        <a href="#/new" class="btn btn-primary btn-sm">+ New booking</a>
      </div>
    </div>
  </header>

  <!-- Mobile Top Bar -->
  <div class="mobile-top-bar">
    <a href="#/overview" class="brand-group">
      <img src="assets/oryan-logo.png" alt="O'Ryan" class="brand-logo-img" style="height: 32px;">
      <span class="brand-name" style="font-size: 14px;">O’Ryan Ledger</span>
    </a>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
      <a href="#/new" class="btn btn-primary btn-sm">+ New</a>
    </div>
  </div>

  <main class="main-content">
    <div class="page-header">
      <div class="page-title-group">
        <h1>Today at O’Ryan</h1>
        <p class="page-description">{{v1}}</p>
      </div>
      <div class="page-actions">
        <a href="#/booking/sophia/pay" class="btn btn-quiet">
          <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Record payment
        </a>
        <a href="#/new" class="btn btn-primary">
          <svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New booking
        </a>
      </div>
    </div>

    <!-- Quick Action Strip -->
    <div class="quick-action-strip">
      <a href="#/new" class="quick-action-card">
        <div class="quick-action-icon">
          <svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <div class="quick-action-info">
          <h4>New booking</h4>
          <p>Reserve date, check conflicts &amp; set hall price</p>
        </div>
      </a>
      <a href="#/booking/sophia/pay" class="quick-action-card">
        <div class="quick-action-icon">
          <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </div>
        <div class="quick-action-info">
          <h4>Record payment</h4>
          <p>Post money received toward an event balance</p>
        </div>
      </a>
      <a href="#/calendar" class="quick-action-card">
        <div class="quick-action-icon">
          <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="quick-action-info">
          <h4>Calendar snapshot</h4>
          <p>{{v2}}</p>
        </div>
      </a>
    </div>

    <!-- 3 Key Numbers At Most -->
    <section class="overview-stats" aria-label="Key ledger metrics">
      <div class="stat-item">
        <div class="stat-label">Balance to collect</div>
        <div class="stat-value stat-highlight">{{v3}}</div>
        <div class="stat-note">{{v4}}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">November payments</div>
        <div class="stat-value">{{v5}}</div>
        <div class="stat-note">{{v6}}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Events this month</div>
        <div class="stat-value">{{v7}}</div>
        <div class="stat-note">{{v8}}</div>
      </div>
    </section>

    <!-- 'Needs You' Triage Section (Max 5 items, each 1-tap action) -->
    <section class="card triage-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Needs your attention</h2>
          <p class="card-subtitle">{{v9}}</p>
        </div>
        <span class="badge badge-due">{{v10}}</span>
      </div>
      <div class="triage-list">
        <!-- Item 1: Overdue Balance -->
        <div class="triage-item">
          <div class="triage-info">
            <div class="triage-icon danger">
              <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div class="triage-text">
              <h5>{{v11}}</h5>
              <p>{{v12}}</p>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="#/booking/sophia/pay" class="btn btn-primary btn-sm">Record payment</a>
          </div>
        </div>

        <!-- Item 2: Missing Agreed Price -->
        <div class="triage-item">
          <div class="triage-info">
            <div class="triage-icon warning">
              <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div class="triage-text">
              <h5>Missing agreed price &middot; Devon Washington</h5>
              <p>{{v13}}</p>
            </div>
          </div>
          <div>
            <a href="#/booking/devon/edit" class="btn btn-quiet btn-sm">Set price breakdown</a>
          </div>
        </div>

        <!-- Item 3: Past Event Not Settled -->
        <div class="triage-item">
          <div class="triage-info">
            <div class="triage-icon info">
              <svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="triage-text">
              <h5>Past event not marked settled &middot; Elena Rostova Shower</h5>
              <p>{{v14}}</p>
            </div>
          </div>
          <div>
            <button type="button" class="btn btn-quiet btn-sm" data-action="overview-0">Mark settled</button>
          </div>
        </div>

        <!-- Item 4: Refundable Deposit to Return -->
        <div class="triage-item">
          <div class="triage-info">
            <div class="triage-icon warning">
              <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div class="triage-text">
              <h5>{{v15}}</h5>
              <p>{{v16}}</p>
            </div>
          </div>
          <div>
            <a href="#/booking/sophia" class="btn btn-quiet btn-sm">Review deposit</a>
          </div>
        </div>

        <!-- Item 5: Unreconciled Imported Balance -->
        <div class="triage-item">
          <div class="triage-info">
            <div class="triage-icon warning">
              <svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="triage-text">
              <h5>{{v17}}</h5>
              <p>Legacy spreadsheet total differs from journaled receipts &middot; Verify opening lines</p>
            </div>
          </div>
          <div>
            <a href="#/booking/elena" class="btn btn-quiet btn-sm">Reconcile</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Next 3 Events Section -->
    <section class="card" style="margin-bottom: var(--space-6);">
      <div class="card-header">
        <div>
          <h2 class="card-title">{{v18}}</h2>
          <p class="card-subtitle">Immediate events requiring venue staging and final balances</p>
        </div>
        <a href="#/bookings" class="btn btn-quiet btn-sm">View all bookings &rarr;</a>
      </div>

      <div class="events-trio">
        <!-- Event 1 -->
        <div class="event-brief-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div class="date-pill">Nov <span>{{v19}}</span> &middot; Sat</div>
              <span class="badge badge-due">{{v20}}</span>
            </div>
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text);">Sophia Martinez &amp; Carlos Ray</h3>
            <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">{{v21}}</p>
          </div>
          <div style="background-color: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; display: flex; justify-content: space-between;">
            <span>Agreed: <strong>{{v22}}</strong></span>
            <span>Paid: <strong>{{v23}}</strong></span>
            <span style="color: var(--warning-text); font-weight: 700;">{{v24}}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="#/booking/sophia" class="btn btn-quiet btn-sm" style="flex: 1;">View details</a>
            <a href="#/booking/sophia/pay" class="btn btn-primary btn-sm" style="flex: 1;">Pay balance</a>
          </div>
        </div>

        <!-- Event 2 -->
        <div class="event-brief-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div class="date-pill">Nov <span>{{v25}}</span> &middot; Sat</div>
              <span class="badge badge-paid">Paid in full</span>
            </div>
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text);">Amara Okafor Celebration</h3>
            <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">{{v26}}</p>
          </div>
          <div style="background-color: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; display: flex; justify-content: space-between;">
            <span>Agreed: <strong>{{v27}}</strong></span>
            <span>Paid: <strong>{{v28}}</strong></span>
            <span style="color: var(--success-text); font-weight: 700;">{{v29}}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="#/booking/amara" class="btn btn-quiet btn-sm" style="flex: 1;">View details</a>
            <a href="#/booking/amara" class="btn btn-quiet btn-sm" style="flex: 1;">Contract PDF</a>
          </div>
        </div>

        <!-- Event 3 -->
        <div class="event-brief-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div class="date-pill">Dec <span>{{v30}}</span> &middot; Sat</div>
              <span class="badge badge-due">{{v31}}</span>
            </div>
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text);">{{v32}}</h3>
            <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">{{v33}}</p>
          </div>
          <div style="background-color: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; display: flex; justify-content: space-between;">
            <span>Agreed: <strong>{{v34}}</strong></span>
            <span>Paid: <strong>{{v35}}</strong></span>
            <span style="color: var(--warning-text); font-weight: 700;">{{v36}}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="#/booking/mateo" class="btn btn-quiet btn-sm" style="flex: 1;">View details</a>
            <a href="#/booking/mateo/pay" class="btn btn-primary btn-sm" style="flex: 1;">Pay balance</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Mobile Bottom Nav -->
  <nav class="mobile-bottom-bar">
    <div class="mobile-nav-items">
      <a href="#/overview" class="mobile-nav-link active">
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
export const styles = ``;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
