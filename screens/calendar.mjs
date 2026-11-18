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
        <a href="#/calendar" class="nav-link active">Calendar</a>
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
    <a href="#/overview" class="brand-group">
      <img src="assets/oryan-logo.png" alt="O'Ryan" class="brand-logo-img" style="height: 32px;">
      <span class="brand-name" style="font-size: 14px;">Calendar</span>
    </a>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
      <a href="#/new" class="btn btn-primary btn-sm">+ New</a>
    </div>
  </div>

  <main class="main-content">
    <div class="page-header">
      <div class="page-title-group">
        <h1>Venue Calendar &amp; Availability</h1>
        <p class="page-description">Monthly reservation grid &middot; Check date conflicts, holds, and daily event schedules.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-quiet" data-action="calendar-0">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          Block a date
        </button>
        <a href="#/new" class="btn btn-primary">
          <svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New booking
        </a>
      </div>
    </div>

    <!-- Calendar Month Navigation Controls -->
    <div class="card" style="margin-bottom: var(--space-5); padding: var(--space-4);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3);">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: var(--text);" id="calHeaderTitle">{{v1}}</h2>
          <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">{{v2}}</p>
        </div>

        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-quiet btn-sm" id="btnPrevMonth">&larr; October</button>
          <button type="button" class="btn btn-quiet btn-sm" id="btnTodayMonth" style="border-color: var(--accent); color: var(--accent); font-weight: 700;">{{v3}}</button>
          <button type="button" class="btn btn-quiet btn-sm" id="btnNextMonth">December &rarr;</button>
          <button type="button" class="btn btn-quiet btn-sm" style="color: var(--accent);" data-day="21">Jump to next booking &rarr;</button>
        </div>
      </div>
    </div>

    <!-- Calendar Layout Grid -->
    <div class="cal-container">
      <!-- Left: Month Grid -->
      <div class="card">
        <!-- Weekdays Header -->
        <div class="cal-grid-header">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <!-- 35 Days Grid for Nov 2026 (Nov 1 is Sunday) -->
        <div class="cal-month-days">
          <!-- Nov 1 -->
          <div class="cal-day-cell" data-day="1">
            <span class="cal-day-num">{{v4}}</span>
            <div class="cal-day-pills">
              <span class="cal-event-micro-pill due" title="Final balance deadline">Sophia deadline</span>
            </div>
          </div>
          <!-- Nov 2-6 -->
          <div class="cal-day-cell" data-day="2"><span class="cal-day-num">{{v5}}</span></div>
          <div class="cal-day-cell" data-day="3"><span class="cal-day-num">{{v6}}</span></div>
          <div class="cal-day-cell" data-day="4"><span class="cal-day-num">{{v7}}</span></div>
          <div class="cal-day-cell" data-day="5"><span class="cal-day-num">{{v8}}</span></div>
          <div class="cal-day-cell" data-day="6"><span class="cal-day-num">{{v9}}</span></div>
          <!-- Nov 7: Past Event -->
          <div class="cal-day-cell" data-day="7">
            <span class="cal-day-num">{{v10}}</span>
            <div class="cal-day-pills">
              <span class="cal-event-micro-pill paid">Date available</span>
            </div>
          </div>
          <!-- Nov 8-14 -->
          <div class="cal-day-cell" data-day="8"><span class="cal-day-num">{{v11}}</span></div>
          <div class="cal-day-cell" data-day="9"><span class="cal-day-num">{{v12}}</span></div>
          <div class="cal-day-cell" data-day="10"><span class="cal-day-num">{{v13}}</span></div>
          <div class="cal-day-cell" data-day="11"><span class="cal-day-num">{{v14}}</span></div>
          <div class="cal-day-cell" data-day="12"><span class="cal-day-num">{{v15}}</span></div>
          <div class="cal-day-cell" data-day="13"><span class="cal-day-num">{{v16}}</span></div>
          <div class="cal-day-cell" data-day="14"><span class="cal-day-num">{{v17}}</span></div>
          <!-- Nov 15: TODAY MARKER -->
          <div class="cal-day-cell is-today" data-day="15">
            <span class="cal-day-num" style="color: var(--accent); font-weight: 800;">{{v18}}</span>
            <div class="cal-day-pills">
              <span style="font-size: 9px; font-weight: 700; color: var(--accent);">TODAY</span>
            </div>
          </div>
          <!-- Nov 16-20 -->
          <div class="cal-day-cell" data-day="16"><span class="cal-day-num">{{v19}}</span></div>
          <div class="cal-day-cell" data-day="17"><span class="cal-day-num">{{v20}}</span></div>
          <div class="cal-day-cell" data-day="18"><span class="cal-day-num">{{v21}}</span></div>
          <div class="cal-day-cell" data-day="19"><span class="cal-day-num">{{v22}}</span></div>
          <div class="cal-day-cell" data-day="20"><span class="cal-day-num">{{v23}}</span></div>
          <!-- Nov 21: Sophia Martinez Wedding -->
          <div class="cal-day-cell" style="border-color: var(--accent);" data-day="21">
            <span class="cal-day-num" style="font-weight: 800; color: var(--accent);">{{v24}}</span>
            <div class="cal-day-pills">
              <span class="cal-event-micro-pill due" title="Sophia Martinez Wedding">{{v25}}</span>
            </div>
          </div>
          <!-- Nov 22-27 -->
          <div class="cal-day-cell" data-day="22"><span class="cal-day-num">{{v26}}</span></div>
          <div class="cal-day-cell" data-day="23"><span class="cal-day-num">{{v27}}</span></div>
          <div class="cal-day-cell" data-day="24"><span class="cal-day-num">{{v28}}</span></div>
          <div class="cal-day-cell" data-day="25"><span class="cal-day-num">{{v29}}</span></div>
          <div class="cal-day-cell" data-day="26"><span class="cal-day-num">{{v30}}</span></div>
          <div class="cal-day-cell" data-day="27"><span class="cal-day-num">{{v31}}</span></div>
          <!-- Nov 28: Amara Okafor Quinceañera -->
          <div class="cal-day-cell" data-day="28">
            <span class="cal-day-num" style="font-weight: 800;">{{v32}}</span>
            <div class="cal-day-pills">
              <span class="cal-event-micro-pill paid" title="Amara Okafor Celebration">Amara Okafor (Paid)</span>
            </div>
          </div>
          <!-- Nov 29-30 -->
          <div class="cal-day-cell" data-day="29"><span class="cal-day-num">{{v33}}</span></div>
          <div class="cal-day-cell" data-day="30"><span class="cal-day-num">{{v34}}</span></div>
          <!-- Dec 1-5 (Next month trailing) -->
          <div class="cal-day-cell other-month"><span class="cal-day-num">{{v35}}</span></div>
          <div class="cal-day-cell other-month"><span class="cal-day-num">{{v36}}</span></div>
          <div class="cal-day-cell other-month"><span class="cal-day-num">{{v37}}</span></div>
          <div class="cal-day-cell other-month"><span class="cal-day-num">{{v38}}</span></div>
          <div class="cal-day-cell other-month"><span class="cal-day-num">{{v39}}</span></div>
        </div>

        <!-- Legend -->
        <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--line-subtle); font-size: 11px; color: var(--muted);">
          <span style="display: inline-flex; align-items: center; gap: 5px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--success);"></span> Paid in full
          </span>
          <span style="display: inline-flex; align-items: center; gap: 5px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--warning);"></span> Balance due
          </span>
          <span style="display: inline-flex; align-items: center; gap: 5px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--danger);"></span> Overdue / Review
          </span>
          <span style="display: inline-flex; align-items: center; gap: 5px;">
            <span style="width: 8px; height: 8px; border-radius: 2px; background-color: var(--cancelled-border);"></span> Blocked date
          </span>
          <span style="display: inline-flex; align-items: center; gap: 5px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--accent);"></span> Today
          </span>
        </div>
      </div>

      <!-- Right: Day Schedule & Tapped Date Panel -->
      <div class="card" id="daySchedulePanel">
        <div class="card-header">
          <div>
            <h3 class="card-title" id="selectedDateTitle">{{v40}}</h3>
            <p class="card-subtitle" id="selectedDateSubtitle">{{v41}}</p>
          </div>
          <span class="badge badge-due" id="selectedDateBadge">Booked</span>
        </div>

        <div id="dayScheduleContent">
          <!-- Booked Event Detail Card -->
          <div style="background-color: var(--bg-subtle); border: 1px solid var(--line); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h4 style="font-size: 15px; font-weight: 700; color: var(--text);">Sophia Martinez &amp; Carlos Ray</h4>
                <p style="font-size: 12px; color: var(--muted); margin-top: 2px;">{{v42}}</p>
                <div style="font-size: 11px; color: var(--muted); margin-top: 6px;">
                  Rental Window: <strong>{{v43}}</strong>{{v44}}</div>
              </div>
              <span class="badge badge-overdue">Balance Overdue</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--line-subtle); font-size: 12px;">
              <span>Agreed: <strong>{{v45}}</strong></span>
              <span>Paid: <strong>{{v46}}</strong></span>
              <span style="color: var(--warning-text); font-weight: 700;">{{v47}}</span>
            </div>

            <div style="display: flex; gap: 8px; margin-top: var(--space-3);">
              <a href="#/booking/sophia" class="btn btn-quiet btn-sm" style="flex: 1;">View details</a>
              <a href="#/booking/sophia/pay" class="btn btn-primary btn-sm" style="flex: 1;">Record payment</a>
            </div>
          </div>
        </div>

        <!-- Direct Action to Book / Block Date -->
        <div style="border-top: 1px solid var(--line-subtle); padding-top: var(--space-4); margin-top: var(--space-4);">
          <a href="#/new?date=2026-11-21" class="btn btn-quiet" style="width: 100%;">
            + Reserve another date
          </a>
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
      <a href="#/calendar" class="mobile-nav-link active">
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
