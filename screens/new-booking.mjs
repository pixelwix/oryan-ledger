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
        <a href="#/bookings" class="btn btn-quiet btn-sm">&larr; Back to bookings</a>
      </div>
    </div>
  </header>

  <!-- Mobile Top Bar -->
  <div class="mobile-top-bar">
    <a href="#/bookings" class="btn btn-quiet btn-sm" style="padding: 6px 10px;">
      &larr; Cancel
    </a>
    <span class="brand-name" style="font-size: 14px; font-weight: 700;">New Booking</span>
    <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
  </div>

  <main class="main-content" style="max-width: 760px;">
    <div class="page-header" style="border-bottom: none; margin-bottom: var(--space-4);">
      <div class="page-title-group">
        <h1>New Event Reservation</h1>
        <p class="page-description">Reserve an exclusive event date, itemize agreed pricing, and record opening payments.</p>
      </div>
    </div>

    <!-- Stepper Indicator -->
    <div class="stepper-nav">
      <div class="stepper-step active" id="stepIndicator1">
        <span class="stepper-num">{{v1}}</span>
        <span>Guest &amp; Date</span>
      </div>
      <div class="stepper-line"></div>
      <div class="stepper-step" id="stepIndicator2">
        <span class="stepper-num">{{v2}}</span>
        <span>Price Breakdown &amp; Deposit</span>
      </div>
    </div>

    <form id="newBookingForm" data-action="new-booking-0">
      <!-- STEP 1: GUEST & DATE -->
      <div id="step1Section" class="card">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: var(--space-4);">{{v3}}</h2>

        <div class="form-group">
          <label class="form-label" for="guestName">
            <span>Primary guest name <strong style="color: var(--danger-text);">*</strong></span>
            <span class="form-label-note">First and last name</span>
          </label>
          <input type="text" id="guestName" class="form-input" placeholder="e.g. Marcus & Helena Vance" required maxlength="120">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="form-group">
            <label class="form-label" for="guestPhone">
              <span>Phone number <strong style="color: var(--danger-text);">*</strong></span>
            </label>
            <input type="tel" id="guestPhone" class="form-input" placeholder="(555) 018-0249" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="guestEmail">
              <span>Email address</span>
            </label>
            <input type="email" id="guestEmail" class="form-input" placeholder="guest@example.invalid">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-3);">
          <div class="form-group">
            <label class="form-label" for="eventDate">
              <span>Event date <strong style="color: var(--danger-text);">*</strong></span>
              <span class="form-label-note" id="dateCheckStatus" style="color: var(--success-text);">Date available ✓</span>
            </label>
            <input type="date" id="eventDate" class="form-input" value="{{v19}}" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="eventType">
              <span>Celebration type <strong style="color: var(--danger-text);">*</strong></span>
            </label>
            <select id="eventType" class="form-select" required>
              <option value="Wedding" selected>Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Baby Shower">Baby Shower</option>
              <option value="Bridal Shower">Bridal Shower</option>
              <option value="Graduation">Graduation</option>
              <option value="Engagement">Engagement</option>
              <option value="Business">Business</option>
              <option value="Quinceañera">Quinceañera</option>
              <option value="Baptism">Baptism</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="guestCount">
            <span>Estimated guest count</span>
            <span class="form-label-note">{{v4}}</span>
          </label>
          <input type="number" id="guestCount" class="form-input" value="{{v28}}" min="1" max="153">
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: var(--space-4);">
          <button type="button" class="btn btn-primary" id="btnContinueStep2">{{v5}}</button>
        </div>
      </div>

      <!-- STEP 2: PRICE BREAKDOWN & OPENING PAYMENT -->
      <div id="step2Section" class="card" style="display: none;">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: var(--space-4);">{{v6}}</h2>

        <div class="form-group">
          <label class="form-label" for="newHallPrice">
            <span>{{v7}}<strong style="color: var(--danger-text);">*</strong></span>
          </label>
          <input type="number" id="newHallPrice" class="form-input" min="0" step="0.01" value="{{v29}}" required>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span>Select extras to include in agreed total</span>
          </label>
          <div style="background-color: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: var(--space-3); display: flex; flex-direction: column; gap: 8px;">
            <label class="form-checkbox-label">
              <input type="checkbox" id="extraCovers" class="form-checkbox" checked>
              <span>{{v8}}</span>
            </label>
            <label class="form-checkbox-label">
              <input type="checkbox" id="extraProjector" class="form-checkbox">
              <span>{{v9}}</span>
            </label>
            <label class="form-checkbox-label">
              <input type="checkbox" id="extraAudio" class="form-checkbox" checked>
              <span>{{v10}}</span>
            </label>
            <label class="form-checkbox-label">
              <input type="checkbox" id="extraBar" class="form-checkbox">
              <span>Bar Service Setup (Included Free)</span>
            </label>
            <label class="form-checkbox-label">
              <input type="checkbox" id="extraSecurity" class="form-checkbox" checked>
              <span>{{v11}}</span>
            </label>
          </div>
        </div>

        <!-- Opening Payment Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="form-group">
            <label class="form-label" for="initialPaid">
              <span>{{v12}}</span>
              <span class="form-label-note">Optional opening payment</span>
            </label>
            <input type="number" id="initialPaid" class="form-input" min="0" step="0.01" value="{{v30}}">
          </div>
          <div class="form-group">
            <label class="form-label" for="initialMethod">
              <span>Payment method</span>
            </label>
            <select id="initialMethod" class="form-select">
              <option value="{{v31}}" selected>Cash</option>
              <option value="{{v32}}">Card</option>
              <option value="{{v33}}">Check</option>
              <option value="{{v34}}">Zelle</option>
            </select>
          </div>
        </div>

        <!-- Separate Refundable Deposit -->
        <div class="form-group">
          <label class="form-label" for="depositStatus">
            <span>Refundable damage deposit</span>
            <span class="form-label-note">Kept separate from event balance</span>
          </label>
          <select id="depositStatus" class="form-select">
            <option value="{{v35}}">{{v13}}</option>
            <option value="{{v36}}">{{v14}}</option>
            <option value="{{v37}}">Waived by Owner</option>
          </select>
        </div>

        <!-- Live Total Calculation Card -->
        <div class="live-calculation-card">
          <div class="live-calc-row">
            <span>Computed agreed event price:</span>
            <strong id="newAgreedTotal" style="color: var(--accent); font-size: 16px;">{{v15}}</strong>
          </div>
          <div class="live-calc-row">
            <span>Initial payment received:</span>
            <span id="newPaidPreview" style="color: var(--success-text); font-weight: 600;">{{v16}}</span>
          </div>
          <div class="live-calc-row live-calc-highlight">
            <span>Remaining balance to collect:</span>
            <strong id="newRemainingBalance" style="font-size: 18px; color: var(--warning-text);">{{v17}}</strong>
          </div>
        </div>

        <!-- Form Actions -->
        <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); justify-content: space-between; margin-top: var(--space-4); border-top: 1px solid var(--line-subtle); padding-top: var(--space-4);">
          <button type="button" class="btn btn-quiet" id="btnBackStep1">{{v18}}</button>
          <button type="submit" class="btn btn-primary" id="btnSaveBooking">Save booking &amp; reserve date</button>
        </div>
      </div>
    </form>
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
      <a href="#/new" class="mobile-nav-link quick-add active" aria-label="New booking">
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
    .stepper-nav {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--line);
    }
    .stepper-step {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
    }
    .stepper-step.active {
      color: var(--accent);
    }
    .stepper-num {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background-color: var(--bg-subtle);
      border: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .stepper-step.active .stepper-num {
      background-color: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border-color: var(--btn-primary-bg);
    }
    .stepper-line {
      flex: 1;
      height: 1px;
      background-color: var(--line);
    }
  `;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
