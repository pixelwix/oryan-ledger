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
        <a href="#/booking/sophia" class="btn btn-quiet btn-sm">&larr; Back to details</a>
      </div>
    </div>
  </header>

  <!-- Mobile Top Bar -->
  <div class="mobile-top-bar">
    <a href="#/booking/sophia" class="btn btn-quiet btn-sm" style="padding: 6px 10px;">
      &larr; Cancel
    </a>
    <span class="brand-name" style="font-size: 14px; font-weight: 700;">Edit Booking</span>
    <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
  </div>

  <!-- Background content context -->
  <div class="main-content" style="opacity: 0.15; pointer-events: none; filter: blur(2px);" aria-hidden="true">
    <div class="page-header">
      <div class="page-title-group">
        <h1>Sophia Martinez &amp; Carlos Ray</h1>
        <p class="page-description">{{v1}}</p>
      </div>
    </div>
  </div>

  <!-- Edit Bottom Sheet / Modal Dialog (Phone bottom-sheet behaviour) -->
  <div class="modal-backdrop" id="editModal" style="display: flex;">
    <div class="modal-dialog" role="dialog" aria-labelledby="editModalTitle">
      <div class="modal-header">
        <div>
          <span class="badge badge-due" style="margin-bottom: 4px;">{{v2}}</span>
          <h2 class="modal-title" id="editModalTitle">Edit Price Breakdown</h2>
          <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">{{v3}}</p>
        </div>
        <a href="#/booking/sophia" class="modal-close-btn" aria-label="Close edit form">&times;</a>
      </div>

      <form id="priceBreakdownForm" data-action="edit-booking-0">
        <!-- Hall Rental Base Price -->
        <div class="form-group">
          <label class="form-label" for="lineHall">
            <span>{{v4}}</span>
            <span class="form-label-note">Base venue reservation</span>
          </label>
          <input type="number" id="lineHall" class="form-input" min="0" max="1000000" step="0.01" value="{{v13}}" required>
        </div>

        <!-- 5 Standard Extras with Checkbox + Price -->
        <div class="form-group">
          <label class="form-label">
            <span>Standard extras</span>
            <span class="form-label-note">Select services included</span>
          </label>
          <div style="background-color: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: var(--space-3);">
            <!-- Extra 1: Covers -->
            <div class="standard-extra-row">
              <label class="form-checkbox-label">
                <input type="checkbox" id="checkCovers" class="form-checkbox" checked>
                <span>Extra Chair &amp; Table Covers</span>
              </label>
              <input type="number" id="priceCovers" class="form-input" style="width: 100px; min-height: 36px; padding: 4px 8px;" value="{{v14}}" step="0.01">
            </div>

            <!-- Extra 2: Projector -->
            <div class="standard-extra-row">
              <label class="form-checkbox-label">
                <input type="checkbox" id="checkProjector" class="form-checkbox" checked>
                <span>Projector &amp; Screen</span>
              </label>
              <input type="number" id="priceProjector" class="form-input" style="width: 100px; min-height: 36px; padding: 4px 8px;" value="{{v15}}" step="0.01">
            </div>

            <!-- Extra 3: Audio / Sound System -->
            <div class="standard-extra-row">
              <label class="form-checkbox-label">
                <input type="checkbox" id="checkAudio" class="form-checkbox" checked>
                <span>Sound System &amp; Mics</span>
              </label>
              <input type="number" id="priceAudio" class="form-input" style="width: 100px; min-height: 36px; padding: 4px 8px;" value="{{v16}}" step="0.01">
            </div>

            <!-- Extra 4: Bar Setup -->
            <div class="standard-extra-row">
              <label class="form-checkbox-label">
                <input type="checkbox" id="checkBar" class="form-checkbox">
                <span>Bar Service Setup</span>
              </label>
              <input type="number" id="priceBar" class="form-input" style="width: 100px; min-height: 36px; padding: 4px 8px;" value="{{v17}}" step="0.01" disabled>
            </div>

            <!-- Extra 5: Security Guard -->
            <div class="standard-extra-row">
              <label class="form-checkbox-label">
                <input type="checkbox" id="checkSecurity" class="form-checkbox" checked>
                <span>{{v5}}</span>
              </label>
              <input type="number" id="priceSecurity" class="form-input" style="width: 100px; min-height: 36px; padding: 4px 8px;" value="{{v18}}" step="0.01">
            </div>
          </div>
        </div>

        <!-- Custom Extras Section (Add / Remove) -->
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="margin-bottom: 0;">
              <span>Custom extras</span>
              <span class="form-label-note">{{v6}}</span>
            </label>
            <button type="button" class="btn btn-quiet btn-sm" id="btnAddCustomExtra" style="padding: 2px 8px; font-size: 11px;">
              + Add custom extra
            </button>
          </div>

          <div class="custom-extras-list" id="customExtrasContainer">
            <!-- Custom Row 1 -->
            <div class="custom-extra-row">
              <input type="text" class="form-input custom-label" placeholder="Extra description" value="{{v19}}" maxlength="60" required style="min-height: 36px; font-size: 12px;">
              <input type="number" class="form-input custom-amount" placeholder="Amount" value="{{v20}}" step="0.01" min="0" required style="min-height: 36px; font-size: 12px;">
              <button type="button" class="btn btn-quiet btn-sm btn-remove-custom" style="color: var(--danger-text); padding: 4px 8px;" title="Remove this extra">&times;</button>
            </div>
          </div>
        </div>

        <!-- Discount & Note -->
        <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: var(--space-3);">
          <div class="form-group">
            <label class="form-label" for="lineDiscount">{{v7}}</label>
            <input type="number" id="lineDiscount" class="form-input" min="0" step="0.01" value="{{v21}}">
          </div>
          <div class="form-group">
            <label class="form-label" for="lineDiscountNote">Discount note</label>
            <input type="text" id="lineDiscountNote" class="form-input" maxlength="150" value="{{v22}}" placeholder="Reason for discount">
          </div>
        </div>

        <!-- Live Agreed Total & Balance Calculation Box -->
        <div class="live-calculation-card">
          <div class="live-calc-row">
            <span style="color: var(--muted);">Original agreed total:</span>
            <strong id="displayWasTotal">{{v8}}</strong>
          </div>
          <div class="live-calc-row">
            <span>New agreed total:</span>
            <strong id="displayNewTotal" style="color: var(--accent); font-size: 15px;">{{v9}}</strong>
          </div>
          <div class="live-calc-row">
            <span>Event payments recorded so far:</span>
            <span id="displayPaidSoFar" style="color: var(--success-text); font-weight: 600;">{{v10}}</span>
          </div>
          <div class="live-calc-row live-calc-highlight">
            <span>Balance due after change:</span>
            <strong id="displayBalanceAfter" style="font-size: 18px; color: var(--warning-text);">{{v11}}</strong>
          </div>
        </div>

        <!-- Live Credit / Overpayment Warning Banner -->
        <div class="alert alert-danger" id="creditWarningBanner" style="display: none;">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <strong>Credit / Overpayment Warning:</strong>
            New agreed total is less than the payments recorded so far (<span id="creditAmountText">{{v12}}</span>). You will need to review an event refund.
          </div>
        </div>

        <!-- Past / Settled Notice -->
        <div class="alert alert-info">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            Changing prices recalculates the remaining balance immediately. Immutable contract PDFs must be regenerated if required.
          </div>
        </div>

        <!-- Required Reason for Change (Audit Requirement) -->
        <div class="form-group" style="margin-top: var(--space-4);">
          <label class="form-label" for="changeReason">
            <span>Reason for this change <strong style="color: var(--danger-text);">*</strong></span>
            <span class="form-label-note">Required for immutable audit journal</span>
          </label>
          <textarea id="changeReason" class="form-textarea" rows="2" required placeholder="Why was the price breakdown changed? (e.g. Added uplighting package per phone call with client)"></textarea>
        </div>

        <!-- Modal Actions Footer -->
        <div style="display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-5); border-top: 1px solid var(--line-subtle); padding-top: var(--space-4);">
          <a href="#/booking/sophia" class="btn btn-quiet">Cancel</a>
          <button type="submit" class="btn btn-primary" id="btnSaveBreakdown">Save price breakdown</button>
        </div>
      </form>
    </div>
  </div>

  `;
export const styles = `
    .custom-extras-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin: var(--space-3) 0;
    }
    .custom-extra-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr auto;
      gap: var(--space-2);
      align-items: center;
      background-color: var(--bg-subtle);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
    }
    @media (max-width: 600px) {
      .custom-extra-row {
        grid-template-columns: 1fr;
      }
    }
    .standard-extra-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: 8px 0;
      border-bottom: 1px solid var(--line-subtle);
    }
    .standard-extra-row:last-child {
      border-bottom: none;
    }
  `;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
