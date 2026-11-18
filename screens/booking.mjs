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
        <a href="#/overview" class="nav-link">Overview</a>
        <a href="#/bookings" class="nav-link active">Bookings</a>
        <a href="#/calendar" class="nav-link">Calendar</a>
        <a href="#/payments" class="nav-link">Payments</a>
        <a href="#/insights" class="nav-link">Insights</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
        <a href="#/new" class="btn btn-primary btn-sm">+ New booking</a>
      </div>
    </div>
  </header>

  <!-- Mobile Top Bar -->
  <div class="mobile-top-bar">
    <a href="#/bookings" class="btn btn-quiet btn-sm" style="padding: 6px 10px;">
      &larr; Bookings
    </a>
    <span class="brand-name" style="font-size: 14px; font-weight: 700;">Booking Details</span>
    <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
  </div>

  <main class="main-content">
    <!-- Breadcrumb / Back Link -->
    <div style="margin-bottom: var(--space-3);">
      <a href="bookings.html" style="font-size: 12px; font-weight: 500; color: var(--muted); display: inline-flex; align-items: center; gap: 4px;">
        &larr; Back to all bookings
      </a>
    </div>

    <!-- Booking Header Card -->
    <div class="card booking-header-card">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
          <span class="badge badge-due">{{v1}}</span>
          <span class="badge badge-overdue">{{v2}}</span>
          <span class="badge badge-paid">Contract prepared</span>
          <span class="badge badge-blocked">{{v3}}</span>
        </div>
        <h1 style="font-size: 26px; font-weight: 800; color: var(--text); letter-spacing: -0.5px;">
          Sophia Martinez &amp; Carlos Ray
        </h1>
        <p style="font-size: 13px; color: var(--muted); margin-top: 4px;">{{v4}}</p>
        <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: var(--text);">
          <span>Phone: <strong>{{v5}}</strong></span>
          <span>Email: <strong>martinez.ray@example.invalid</strong></span>
        </div>
      </div>

      <div style="text-align: right;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px;">Remaining balance</div>
        <div style="font-size: 32px; font-weight: 800; color: var(--warning-text); font-family: var(--font-mono); line-height: 1.1;">{{v6}}</div>
        <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">{{v7}}</div>
      </div>
    </div>

    <!-- PRIMARY ACTION BAR (Always visible at top, solves Complaint #3) -->
    <div class="primary-action-bar" aria-label="Booking primary actions">
      <a href="#/booking/sophia/pay" class="btn btn-primary">
        <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>{{v8}}</a>

      <a href="#/booking/sophia/edit" class="btn btn-quiet">
        <svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Edit price breakdown
      </a>

      <button type="button" class="btn btn-quiet" data-action="booking-0">
        <svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Contract PDF
      </button>

      <button type="button" class="btn btn-quiet" data-action="booking-1">
        <svg class="icon" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print receipt
      </button>

      <!-- More Actions Dropdown (Rare actions with plain language labels) -->
      <div class="more-dropdown-container">
        <button type="button" class="btn btn-quiet" data-toggle-menu="moreActionsMenu" aria-expanded="false">
          More actions
          <svg class="icon" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="more-dropdown-menu" id="moreActionsMenu">
          <button type="button" class="more-menu-item" data-action="booking-2">
            <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
            Record deposit transaction
          </button>
          <button type="button" class="more-menu-item" data-action="booking-3">
            <svg class="icon" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Record event refund
          </button>
          <button type="button" class="more-menu-item" data-action="booking-4">
            <svg class="icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Payment reminder follow-up
          </button>
          <button type="button" class="more-menu-item" data-action="booking-5">
            <svg class="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Update contract status
          </button>
          <button type="button" class="more-menu-item" data-action="booking-6">
            <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Export to calendar (.ics)
          </button>
          <div class="more-menu-divider"></div>
          <button type="button" class="more-menu-item" style="color: var(--danger-text);" data-action="booking-7">
            <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Cancel booking
          </button>
        </div>
      </div>
    </div>

    <!-- Main Booking Details Grid -->
    <div class="booking-main-grid">
      <!-- Left Column: Price Breakdown & History -->
      <div>
        <!-- Price Breakdown Card -->
        <section class="card" style="margin-bottom: var(--space-6);">
          <div class="card-header">
            <div>
              <h2 class="card-title">Agreed Price Breakdown</h2>
              <p class="card-subtitle">{{v9}}</p>
            </div>
            <a href="#/booking/sophia/edit" class="btn btn-quiet btn-sm">Edit lines</a>
          </div>

          <table class="breakdown-table">
            <tbody>
              <tr>
                <td>Hall Rental Base (Saturday Evening)</td>
                <td>{{v10}}</td>
              </tr>
              <tr>
                <td>{{v11}}</td>
                <td>{{v12}}</td>
              </tr>
              <tr>
                <td>Projector &amp; Screen Rental</td>
                <td>{{v13}}</td>
              </tr>
              <tr>
                <td>Sound System &amp; Microphones</td>
                <td>{{v14}}</td>
              </tr>
              <tr>
                <td>{{v15}}</td>
                <td>{{v16}}</td>
              </tr>
              <tr>
                <td>Custom Extra: Uplighting &amp; Stage Draping</td>
                <td>{{v17}}</td>
              </tr>
              <tr style="color: var(--success-text);">
                <td>Discount: Family Referral Credit (Note: Repeat client)</td>
                <td>{{v18}}</td>
              </tr>
              <tr class="breakdown-total-row">
                <td>Total Agreed Event Charge</td>
                <td>{{v19}}</td>
              </tr>
              <tr>
                <td style="color: var(--muted);">Total Payments Recorded So Far</td>
                <td style="color: var(--success-text);">{{v20}}</td>
              </tr>
              <tr class="breakdown-balance-row">
                <td>Remaining Balance Due</td>
                <td>{{v21}}</td>
              </tr>
            </tbody>
          </table>

          <div class="alert alert-warning" style="margin-top: var(--space-4);">
            <svg class="icon" viewBox="0 0 24 24" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <strong>{{v22}}</strong>{{v23}}</div>
          </div>
        </section>

        <!-- Change History Section (Collapsible) -->
        <section class="card history-card">
          <details open>
            <summary>
              <span>{{v24}}</span>
              <span style="font-size: 11px; color: var(--accent); font-weight: 500;">Click to toggle</span>
            </summary>
            <div style="margin-top: var(--space-3);">
              <div class="history-entry">
                <div class="history-meta">
                  <strong>{{v25}}</strong>
                  <span>Owner</span>
                </div>
                <p><strong>Added Custom Extra:</strong>{{v26}}</p>
                <p style="color: var(--muted); margin-top: 2px;"><em>Reason: "Guest requested uplighting package confirmed over phone."</em></p>
              </div>

              <div class="history-entry">
                <div class="history-meta">
                  <strong>{{v27}}</strong>
                  <span>Owner</span>
                </div>
                <p><strong>Discount applied:</strong>{{v28}}</p>
                <p style="color: var(--muted); margin-top: 2px;"><em>Reason: "Owner approved repeat family referral adjustment."</em></p>
              </div>

              <div class="history-entry">
                <div class="history-meta">
                  <strong>{{v29}}</strong>
                  <span>Front Desk</span>
                </div>
                <p><strong>Initial Booking Created:</strong>{{v30}}</p>
                <p style="color: var(--muted); margin-top: 2px;"><em>Reason: "Signed agreement reservation."</em></p>
              </div>
            </div>
          </details>
        </section>
      </div>

      <!-- Right Column: Timeline & Separate Security Deposit -->
      <div>
        <!-- Payment & Deposit Timeline Card -->
        <section class="card" style="margin-bottom: var(--space-6);">
          <div class="card-header">
            <div>
              <h2 class="card-title">Payment History &amp; Receipts</h2>
              <p class="card-subtitle">{{v31}}</p>
            </div>
            <a href="#/booking/sophia/pay" class="btn btn-primary btn-sm">+ Add payment</a>
          </div>

          <div class="timeline">
            <!-- Payment 1 -->
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h5>
                  <span>{{v32}}</span>
                  <span style="font-size: 11px; color: var(--muted);">{{v33}}</span>
                </h5>
                <p>{{v34}}</p>
                <button type="button" class="btn btn-quiet btn-sm" style="margin-top: 6px; padding: 2px 8px; font-size: 11px;">View receipt PDF</button>
              </div>
            </div>

            <!-- Payment 2 -->
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h5>
                  <span>{{v35}}</span>
                  <span style="font-size: 11px; color: var(--muted);">{{v36}}</span>
                </h5>
                <p>{{v37}}</p>
                <button type="button" class="btn btn-quiet btn-sm" style="margin-top: 6px; padding: 2px 8px; font-size: 11px;">View receipt PDF</button>
              </div>
            </div>
          </div>

          <!-- SEPARATE Security Deposit Box -->
          <div class="deposit-box">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 13px; color: var(--text);">Refundable Security Deposit</strong>
                <p style="font-size: 11px; color: var(--muted); margin-top: 2px;">
                  Held separately from event balance
                </p>
              </div>
              <span class="badge badge-paid">{{v38}}</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: var(--space-3);">
              <button type="button" class="btn btn-quiet btn-sm" style="flex: 1;" data-action="booking-8">{{v39}}</button>
              <button type="button" class="btn btn-quiet btn-sm" style="flex: 1;" data-action="booking-9">Deduct</button>
            </div>
          </div>
        </section>

        <!-- Contract Documents Card -->
        <section class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Contract &amp; Documents</h2>
              <p class="card-subtitle">Immutable PDF agreement copies</p>
            </div>
            <span class="badge badge-paid">Signed</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: var(--space-2);">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid var(--line-subtle); border-radius: var(--radius-sm);">
              <div>
                <strong style="font-size: 13px; display: block;">{{v40}}</strong>
                <span style="font-size: 11px; color: var(--muted);">{{v41}}</span>
              </div>
              <button type="button" class="btn btn-quiet btn-sm">Download</button>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid var(--line-subtle); border-radius: var(--radius-sm);">
              <div>
                <strong style="font-size: 13px; display: block;">{{v42}}</strong>
                <span style="font-size: 11px; color: var(--muted);">{{v43}}</span>
              </div>
              <button type="button" class="btn btn-quiet btn-sm">Download</button>
            </div>
          </div>
        </section>
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
      <a href="#/bookings" class="mobile-nav-link active">
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
    .more-dropdown-container {
      position: relative;
    }
    .more-dropdown-menu {
      display: none;
      position: absolute;
      right: 0;
      top: calc(100% + 6px);
      background-color: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
      z-index: 70;
      width: 240px;
      padding: 6px 0;
    }
    .more-dropdown-menu[open] {
      display: flex;
      flex-direction: column;
    }
    .more-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      font-size: 13px;
      color: var(--text);
      text-decoration: none;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      width: 100%;
    }
    .more-menu-item:hover {
      background-color: var(--surface-hover);
      color: var(--accent);
      text-decoration: none;
    }
    .more-menu-divider {
      height: 1px;
      background-color: var(--line-subtle);
      margin: 6px 0;
    }
    .history-card details summary {
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2) 0;
      color: var(--text);
      user-select: none;
    }
    .history-entry {
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--line-subtle);
      font-size: 12px;
    }
    .history-entry:last-child {
      border-bottom: none;
    }
    .history-meta {
      display: flex;
      justify-content: space-between;
      color: var(--muted);
      margin-bottom: 3px;
      font-size: 11px;
    }
    .deposit-box {
      background-color: var(--bg-subtle);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      padding: var(--space-3) var(--space-4);
      margin-top: var(--space-3);
    }
  `;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
