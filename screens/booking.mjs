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
        <a href="#/bookings" class="nav-link active" data-label="Bookings">Bookings</a>
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
          <span>Email: <strong>[email address]</strong></span>
        </div>
      </div>

      <div style="text-align: right;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px;">Remaining balance</div>
        <div style="font-size: 32px; font-weight: 800; color: var(--warning-text); font-family: var(--font-mono); line-height: 1.1;">{{v6}}</div>
        <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">{{v7}}</div>
      </div>
    </div>

    <div class="primary-action-bar" aria-label="Booking primary actions">
      <a href="#/booking/sophia/pay" class="btn btn-primary">{{v8}}</a>
      <div class="booking-action-menus">
        <div class="more-dropdown-container">
          <button type="button" class="btn btn-quiet" id="bookingDocumentsMenuTrigger" data-toggle-menu="bookingDocumentsMenu" aria-controls="bookingDocumentsMenu" aria-haspopup="menu" aria-expanded="false">
            Documents
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="more-dropdown-menu" id="bookingDocumentsMenu" role="menu" aria-labelledby="bookingDocumentsMenuTrigger">
            <button type="button" class="more-menu-item" role="menuitem" tabindex="-1" data-action="booking-0">Contract PDF</button>
            <button type="button" class="more-menu-item" role="menuitem" tabindex="-1" data-action="booking-1">Print receipt</button>
          </div>
        </div>
        <div class="more-dropdown-container">
          <button type="button" class="btn btn-quiet" id="bookingEditMenuTrigger" data-toggle-menu="bookingEditMenu" aria-controls="bookingEditMenu" aria-haspopup="menu" aria-expanded="false">
            Edit
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="more-dropdown-menu" id="bookingEditMenu" role="menu" aria-labelledby="bookingEditMenuTrigger">
            <a href="#/booking/sophia/edit" class="more-menu-item" role="menuitem" tabindex="-1">Edit price breakdown</a>
          </div>
        </div>
        <div class="more-dropdown-container">
          <button type="button" class="btn btn-quiet" id="moreActionsMenuTrigger" data-toggle-menu="moreActionsMenu" aria-controls="moreActionsMenu" aria-haspopup="menu" aria-expanded="false" disabled>
            More
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="more-dropdown-menu" id="moreActionsMenu" role="menu" aria-labelledby="moreActionsMenuTrigger">
            <button type="button" class="more-menu-item" role="menuitem" tabindex="-1" data-booking-status hidden></button>
            <div class="more-menu-divider" role="separator" data-booking-utility-divider></div>
            <button type="button" class="more-menu-item" role="menuitem" tabindex="-1" data-action="booking-2">Record deposit transaction</button>
            <button type="button" class="more-menu-item" role="menuitem" tabindex="-1" data-action="booking-3">Record event refund</button>
            <button type="button" class="more-menu-item" role="menuitem" tabindex="-1" data-action="booking-4">Payment reminder follow-up</button>
            <button type="button" class="more-menu-item" role="menuitem" tabindex="-1" data-action="booking-5">Update contract status</button>
            <button type="button" class="more-menu-item" role="menuitem" tabindex="-1" data-action="booking-6">Export to calendar (.ics)</button>
          </div>
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
    .booking-contract-note {
      flex-basis: 100%;
      grid-column: 1 / -1;
      line-height: 1rem;
    }
    .booking-action-menus {
      display: flex;
      gap: var(--space-2);
      margin-inline-start: auto;
    }
    /* The pinned bar sits below the header with a small gap; this band fills that gap with the page colour so nothing scrolls visibly behind it. */
    .primary-action-bar::before {
      content: "";
      position: absolute;
      left: -1px;
      right: -1px;
      top: -12px;
      height: 12px;
      background-color: var(--bg);
    }
    .more-dropdown-container {
      position: relative;
    }
    .booking-action-menus .btn .icon {
      width: 14px;
      height: 14px;
    }
    .more-dropdown-menu {
      display: none;
      position: absolute;
      right: 0;
      top: calc(100% + 6px);
      background-color: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      z-index: 70;
      width: 210px;
      max-height: 50vh;
      overflow-y: auto;
      overscroll-behavior-y: contain;
      padding: 6px;
    }
    .more-dropdown-menu[open] {
      display: flex;
      flex-direction: column;
    }
    .more-menu-item {
      display: block;
      flex: none;
      padding: 10px 12px;
      border-radius: 6px;
      font: 500 14px/16px var(--font-sans);
      color: var(--text);
      text-decoration: none;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      width: 100%;
    }
    .more-menu-item:hover, .more-menu-item:focus-visible {
      background-color: var(--surface-hover);
      color: var(--text);
      text-decoration: none;
    }
    .more-menu-divider {
      flex: none;
      height: 1px;
      background-color: var(--line);
      margin: 6px 4px;
    }
    .more-dropdown-container[hidden], .more-menu-item[hidden], .more-menu-divider[hidden] {
      display: none;
    }
    @media (max-width: 768px) {
      .primary-action-bar::before { display: none; }
      .primary-action-bar {
        position: relative;
        top: auto;
      }
      .booking-action-menus {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-inline-start: 0;
      }
      .more-dropdown-container {
        position: static;
      }
      .booking-action-menus .btn {
        padding-inline: 8px;
      }
      .more-dropdown-menu {
        top: calc(100% + 6px);
        width: 62%;
      }
      #bookingEditMenu {
        left: 0;
        width: 100%;
      }
    }
    @media (max-width: 360px) {
      .primary-action-bar > .btn {
        grid-column: 1 / -1;
      }
      .booking-action-menus .btn {
        gap: 4px;
        padding-inline: 4px;
      }
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
