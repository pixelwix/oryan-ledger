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
        <a href="#/bookings" class="nav-link active">Bookings</a>
        <a href="#/calendar" class="nav-link">Calendar</a>
        <a href="#/payments" class="nav-link">Payments</a>
        <a href="#/insights" class="nav-link">Insights</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
        <a href="#/bookings" class="btn btn-quiet btn-sm">&larr; Back to bookings</a>
      </div>
    </div>
  </header>

  <!-- Mobile Top Bar -->
  <div class="mobile-top-bar">
    <a href="#/bookings" class="btn btn-quiet btn-sm" style="padding: 6px 10px;">
      &larr; Cancel
    </a>
    <span class="brand-name" style="font-size: 14px; font-weight: 700;">Record Payment</span>
    <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
  </div>

  <!-- Background content context -->
  <div class="main-content" style="opacity: 0.15; pointer-events: none; filter: blur(2px);" aria-hidden="true">
    <div class="page-header">
      <div class="page-title-group">
        <h1>Bookings Ledger</h1>
        <p class="page-description">{{v1}}</p>
      </div>
    </div>
  </div>

  <!-- Record Payment Sheet / Modal Dialog -->
  <div class="modal-backdrop" id="paymentModal" style="display: flex;">
    <div class="modal-dialog" role="dialog" aria-labelledby="paymentModalTitle">
      <div class="modal-header">
        <div>
          <span class="badge badge-due" style="margin-bottom: 4px;">Record Payment</span>
          <h2 class="modal-title" id="paymentModalTitle">Post Event Payment</h2>
          <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">{{v2}}</p>
        </div>
        <a href="#/bookings" class="modal-close-btn" aria-label="Close payment form">&times;</a>
      </div>

      <!-- Current Balance Snapshot -->
      <div style="background-color: var(--bg-subtle); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px;">Current Balance Due</span>
          <div style="font-size: 20px; font-weight: 800; color: var(--warning-text); font-family: var(--font-mono);">{{v3}}</div>
        </div>
        <button type="button" class="btn btn-quiet btn-sm" id="btnPayFullBalance" style="font-size: 11px;">{{v4}}</button>
      </div>

      <form id="recordPaymentForm" data-action="record-payment-0">
        <!-- Amount Input -->
        <div class="form-group">
          <label class="form-label" for="paymentAmount">
            <span>{{v5}}<strong style="color: var(--danger-text);">*</strong></span>
            <span class="form-label-note">Defaults to balance due</span>
          </label>
          <input type="number" id="paymentAmount" class="form-input" min="0.01" max="1000000" step="0.01" value="{{v9}}" required autofocus>
        </div>

        <!-- Date & Method -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="form-group">
            <label class="form-label" for="paymentDate">
              <span>Date received <strong style="color: var(--danger-text);">*</strong></span>
            </label>
            <input type="date" id="paymentDate" class="form-input" value="{{v10}}" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="paymentMethod">
              <span>Payment method <strong style="color: var(--danger-text);">*</strong></span>
            </label>
            <select id="paymentMethod" class="form-select" required>
              <option value="{{v11}}" selected>Zelle</option>
              <option value="{{v12}}">Cash</option>
              <option value="{{v13}}">Card</option>
              <option value="{{v14}}">Check</option>
              <option value="{{v15}}">Venmo</option>
              <option value="{{v16}}">CashApp</option>
              <option value="{{v17}}">Other</option>
            </select>
          </div>
        </div>

        <!-- Reference / Note -->
        <div class="form-group">
          <label class="form-label" for="paymentNote">
            <span>Transaction note / Reference</span>
            <span class="form-label-note">Optional confirmation code</span>
          </label>
          <input type="text" id="paymentNote" class="form-input" placeholder="e.g. Zelle conf #902849 or check #4102" maxlength="300">
        </div>

        <!-- Live Balance Remaining After Payment -->
        <div class="live-calculation-card" style="margin: var(--space-4) 0;">
          <div class="live-calc-row">
            <span>Balance before payment:</span>
            <strong>{{v6}}</strong>
          </div>
          <div class="live-calc-row">
            <span>This payment:</span>
            <strong id="displayPaymentAmt" style="color: var(--success-text);">{{v7}}</strong>
          </div>
          <div class="live-calc-row live-calc-highlight">
            <span>Remaining balance after:</span>
            <strong id="displayRemainingAfter" style="font-size: 18px; color: var(--success-text);">{{v8}}</strong>
          </div>
        </div>

        <div class="alert alert-info">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            Records funds received into the venue ledger. It does not initiate a bank charge. Refundable damage deposits stay separate.
          </div>
        </div>

        <!-- Modal Actions Footer -->
        <div style="display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-5); border-top: 1px solid var(--line-subtle); padding-top: var(--space-4);">
          <a href="#/bookings" class="btn btn-quiet">Cancel</a>
          <button type="submit" class="btn btn-primary" id="btnSavePayment">
            Save payment &amp; issue receipt
          </button>
        </div>
      </form>
    </div>
  </div>

  `;
export const styles = ``;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
