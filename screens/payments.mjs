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
        <a href="#/bookings" class="nav-link">Bookings</a>
        <a href="#/calendar" class="nav-link">Calendar</a>
        <a href="#/payments" class="nav-link active">Payments</a>
        <a href="#/insights" class="nav-link">Insights</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
        <a href="#/booking/sophia/pay" class="btn btn-primary btn-sm">+ Record payment</a>
      </div>
    </div>
  </header>

  <!-- Mobile Top Bar -->
  <div class="mobile-top-bar">
    <a href="#/overview" class="brand-group">
      <img src="assets/oryan-logo.png" alt="O'Ryan" class="brand-logo-img" style="height: 32px;">
      <span class="brand-name" style="font-size: 14px;">Payments</span>
    </a>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
      <a href="#/booking/sophia/pay" class="btn btn-primary btn-sm">+ Pay</a>
    </div>
  </div>

  <main class="main-content">
    <div class="page-header">
      <div class="page-title-group">
        <h1>Payments &amp; Deposits Ledger</h1>
        <p class="page-description">Dated register; opening sums carried &middot; Security deposits kept strictly separate from event balances.</p>
      </div>
      <div class="page-actions">
        <a href="#/booking/sophia/pay" class="btn btn-primary">
          <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Record payment
        </a>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="overview-stats" style="margin-bottom: var(--space-5);">
      <div class="stat-item">
        <div class="stat-label">Net event payments</div>
        <div class="stat-value" style="color: var(--success-text);">{{v1}}</div>
        <div class="stat-note">{{v2}}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Security deposits held</div>
        <div class="stat-value" style="color: var(--accent);">{{v3}}</div>
        <div class="stat-note">{{v4}}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Refunds &amp; credits</div>
        <div class="stat-value">{{v5}}</div>
        <div class="stat-note">{{v6}}</div>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="filter-toolbar">
      <div class="filter-chips" role="tablist">
        <button class="filter-chip active" data-filter="all">{{v7}}</button>
        <button class="filter-chip" data-filter="payment">{{v8}}</button>
        <button class="filter-chip" data-filter="deposit">{{v9}}</button>
        <button class="filter-chip" data-filter="refund">{{v10}}</button>
      </div>

      <div class="search-sort-group">
        <div class="search-box">
          <svg class="icon" viewBox="0 0 24 24" style="color: var(--muted);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" id="paymentSearch" placeholder="Search receipt, guest, or note..." aria-label="Search payments">
        </div>
        <select class="select-box" id="methodSelect" aria-label="Filter by payment method">
          <option value="{{v40}}">All methods</option>
          <option value="{{v41}}">Zelle</option>
          <option value="{{v42}}">Cash</option>
          <option value="{{v43}}">Card</option>
          <option value="{{v44}}">Check</option>
        </select>
      </div>
    </div>

    <!-- Payments Ledger Table -->
    <div class="ledger-table-wrap">
      <table class="ledger-table payments-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Guest &amp; Contract</th>
            <th>Transaction Type</th>
            <th>Method</th>
            <th style="text-align: right;">Amount</th>
            <th>Receipt / Ref</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody id="paymentsTableBody">
          <!-- Row 1: Sophia Martinez (Zelle payment) -->
          <tr class="ledger-row" data-type="payment" data-method="Zelle">
            <td><strong>{{v11}}</strong></td>
            <td>
              <a href="#/booking/sophia" style="font-weight: 600; color: var(--text);">Sophia Martinez</a>
              <div style="font-size: 11px; color: var(--muted);">{{v12}}</div>
            </td>
            <td><span class="badge badge-paid">Event Payment</span></td>
            <td><span style="font-weight: 500;">Zelle</span></td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text); font-weight: 700;">{{v13}}</td>
            <td><span style="font-family: var(--font-mono); font-size: 11px;">{{v14}}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-quiet btn-sm" data-action="payments-0">PDF</button>
            </td>
          </tr>

          <!-- Row 2: Amara Okafor (Card payment) -->
          <tr class="ledger-row" data-type="payment" data-method="Card">
            <td><strong>{{v15}}</strong></td>
            <td>
              <a href="#/booking/amara" style="font-weight: 600; color: var(--text);">Amara Okafor</a>
              <div style="font-size: 11px; color: var(--muted);">{{v16}}</div>
            </td>
            <td><span class="badge badge-paid">Event Payment</span></td>
            <td><span style="font-weight: 500;">Card</span></td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text); font-weight: 700;">{{v17}}</td>
            <td><span style="font-family: var(--font-mono); font-size: 11px;">{{v18}}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-quiet btn-sm">PDF</button>
            </td>
          </tr>

          <!-- Row 3: Julian Sterling (Deposit Refund) -->
          <tr class="ledger-row" data-type="deposit" data-method="Card">
            <td><strong>{{v19}}</strong></td>
            <td>
              <span style="font-weight: 600; color: var(--text);">Julian Sterling</span>
              <div style="font-size: 11px; color: var(--muted);">{{v20}}</div>
            </td>
            <td><span class="badge badge-blocked">Security Deposit Return</span></td>
            <td><span style="font-weight: 500;">Card</span></td>
            <td class="financial-cell" style="text-align: right; color: var(--muted); font-weight: 700;">{{v21}}</td>
            <td><span style="font-family: var(--font-mono); font-size: 11px;">{{v22}}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-quiet btn-sm">PDF</button>
            </td>
          </tr>

          <!-- Row 4: Mateo Hernandez (Check payment) -->
          <tr class="ledger-row" data-type="payment" data-method="Check">
            <td><strong>{{v23}}</strong></td>
            <td>
              <span style="font-weight: 600; color: var(--text);">Mateo Hernandez</span>
              <div style="font-size: 11px; color: var(--muted);">{{v24}}</div>
            </td>
            <td><span class="badge badge-paid">Event Payment</span></td>
            <td><span style="font-weight: 500;">{{v25}}</span></td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text); font-weight: 700;">{{v26}}</td>
            <td><span style="font-family: var(--font-mono); font-size: 11px;">{{v27}}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-quiet btn-sm">PDF</button>
            </td>
          </tr>

          <!-- Row 5: Sophia Martinez (Security Deposit In) -->
          <tr class="ledger-row" data-type="deposit" data-method="Card">
            <td><strong>{{v28}}</strong></td>
            <td>
              <a href="#/booking/sophia" style="font-weight: 600; color: var(--text);">Sophia Martinez</a>
              <div style="font-size: 11px; color: var(--muted);">{{v29}}</div>
            </td>
            <td><span class="badge badge-due">Security Deposit Received</span></td>
            <td><span style="font-weight: 500;">Card</span></td>
            <td class="financial-cell" style="text-align: right; color: var(--accent); font-weight: 700;">{{v30}}</td>
            <td><span style="font-family: var(--font-mono); font-size: 11px;">{{v31}}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-quiet btn-sm">PDF</button>
            </td>
          </tr>

          <!-- Row 6: Sophia Martinez (Opening payment Cash) -->
          <tr class="ledger-row" data-type="payment" data-method="Cash">
            <td><strong>{{v32}}</strong></td>
            <td>
              <a href="#/booking/sophia" style="font-weight: 600; color: var(--text);">Sophia Martinez</a>
              <div style="font-size: 11px; color: var(--muted);">{{v33}}</div>
            </td>
            <td><span class="badge badge-paid">Event Payment</span></td>
            <td><span style="font-weight: 500;">Cash</span></td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text); font-weight: 700;">{{v34}}</td>
            <td><span style="font-family: var(--font-mono); font-size: 11px;">{{v35}}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-quiet btn-sm">PDF</button>
            </td>
          </tr>

          <!-- Row 7: Aria & Noah Kim (Cancellation fee adjustment) -->
          <tr class="ledger-row" data-type="refund" data-method="Zelle">
            <td><strong>{{v36}}</strong></td>
            <td>
              <span style="font-weight: 600; color: var(--text);">Aria &amp; Noah Kim</span>
              <div style="font-size: 11px; color: var(--muted);">{{v37}}</div>
            </td>
            <td><span class="badge badge-cancelled">Partial Refund</span></td>
            <td><span style="font-weight: 500;">Zelle</span></td>
            <td class="financial-cell" style="text-align: right; color: var(--danger-text); font-weight: 700;">{{v38}}</td>
            <td><span style="font-family: var(--font-mono); font-size: 11px;">{{v39}}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-quiet btn-sm">PDF</button>
            </td>
          </tr>
        </tbody>
      </table>
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
      <a href="#/payments" class="mobile-nav-link active">
        <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        <span>Payments</span>
      </a>
    </div>
  </nav>

  `;
export const styles = ``;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
