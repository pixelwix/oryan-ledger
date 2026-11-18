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
    <a href="#/overview" class="brand-group">
      <img src="assets/oryan-logo.png" alt="O'Ryan" class="brand-logo-img" style="height: 32px;">
      <span class="brand-name" style="font-size: 14px;">Bookings</span>
    </a>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="theme-toggle-btn" aria-label="Toggle theme"></button>
      <a href="#/new" class="btn btn-primary btn-sm">+ New</a>
    </div>
  </div>

  <main class="main-content">
    <div class="page-header">
      <div class="page-title-group">
        <h1>Bookings Ledger</h1>
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

    <!-- Filter & Search Toolbar -->
    <div class="filter-toolbar">
      <div class="filter-chips" role="tablist" aria-label="Filter bookings">
        <button class="filter-chip active" data-filter="all">{{v2}}</button>
        <button class="filter-chip" data-filter="upcoming">{{v3}}</button>
        <button class="filter-chip" data-filter="due">{{v4}}</button>
        <button class="filter-chip" data-filter="attention">{{v5}}</button>
        <button class="filter-chip" data-filter="past">{{v6}}</button>
        <button class="filter-chip" data-filter="cancelled">{{v7}}</button>
      </div>

      <div class="search-sort-group">
        <div class="search-box">
          <svg class="icon" viewBox="0 0 24 24" style="color: var(--muted);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" id="bookingSearchInput" placeholder="Search guest, phone, contract..." aria-label="Search bookings">
        </div>
        <select class="select-box" id="sortSelect" aria-label="Sort bookings">
          <option value="{{v77}}">Event date: Earliest</option>
          <option value="{{v78}}">Event date: Latest</option>
          <option value="{{v79}}">Balance: Highest</option>
          <option value="{{v80}}">Guest: A to Z</option>
        </select>
      </div>
    </div>

    <!-- Sticky Month Divider 1: NOVEMBER 2026 -->
    <div class="month-group-header">
      <span class="month-group-title">{{v8}}</span>
      <span class="today-divider-badge">
        <span class="pulse-dot"></span>{{v9}}</span>
    </div>

    <!-- Ledger Table (Desktop) / Cards (Mobile) -->
    <div class="ledger-table-wrap">
      <table class="ledger-table bookings-table">
        <thead>
          <tr>
            <th style="width: 70px;">Date</th>
            <th>Guest &amp; Celebration</th>
            <th style="text-align: right;">Agreed price</th>
            <th style="text-align: right;">Paid so far</th>
            <th style="text-align: right;">Balance &amp; Status</th>
            <th style="width: 170px; text-align: right;">Quick action</th>
          </tr>
        </thead>
        <tbody id="bookingsTableBody">
          <!-- Row 1: Sophia Martinez (Overdue) -->
          <tr class="ledger-row" data-status="due attention upcoming" data-guest="Sophia Martinez" data-contract="C-2026-089">
            <td>
              <div class="date-block">
                <span class="date-block-month">Nov</span>
                <span class="date-block-day">{{v10}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4><a href="#/booking/sophia" style="color: var(--text);">Sophia Martinez &amp; Carlos Ray</a></h4>
                <p>{{v11}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v12}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v13}}</td>
            <td class="financial-cell" style="text-align: right;">
              <div class="financial-balance balance-due-text">{{v14}}</div>
              <span class="badge badge-overdue">{{v15}}</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/sophia/pay" class="btn btn-primary btn-sm">{{v16}}</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-sophia" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-sophia">
                    <a href="#/booking/sophia" class="dropdown-item">View details</a>
                    <a href="#/booking/sophia/edit" class="dropdown-item">Edit price breakdown</a>
                    <a href="#/booking/sophia" class="dropdown-item">Contract copy (PDF)</a>
                    <div class="dropdown-divider"></div>
                    <button type="button" class="dropdown-item" style="color: var(--danger-text);">Cancel booking</button>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Row 2: Amara Okafor (Paid in full) -->
          <tr class="ledger-row" data-status="upcoming" data-guest="Amara Okafor" data-contract="C-2026-092">
            <td>
              <div class="date-block">
                <span class="date-block-month">Nov</span>
                <span class="date-block-day">{{v17}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4><a href="#/booking/amara" style="color: var(--text);">Amara Okafor Celebration</a></h4>
                <p>{{v18}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v19}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v20}}</td>
            <td class="financial-cell" style="text-align: right;">
              <div class="financial-balance" style="color: var(--success-text);">{{v21}}</div>
              <span class="badge badge-paid">Paid in full</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/amara" class="btn btn-quiet btn-sm">Details</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-amara" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-amara">
                    <a href="#/booking/amara" class="dropdown-item">View details</a>
                    <a href="#/booking/amara" class="dropdown-item">Receipts (PDF)</a>
                    <a href="#/booking/amara/edit" class="dropdown-item">Edit booking</a>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Month Divider 2: DECEMBER 2026 -->
          <tr style="background-color: var(--bg-subtle);">
            <td colspan="6" style="padding: 10px 16px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);">{{v22}}</td>
          </tr>

          <!-- Row 3: Mateo Hernandez (Balance Due) -->
          <tr class="ledger-row" data-status="due upcoming" data-guest="Mateo Hernandez" data-contract="C-2026-095">
            <td>
              <div class="date-block">
                <span class="date-block-month">Dec</span>
                <span class="date-block-day">{{v23}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4><a href="#/booking/mateo" style="color: var(--text);">{{v24}}</a></h4>
                <p>{{v25}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v26}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v27}}</td>
            <td class="financial-cell" style="text-align: right;">
              <div class="financial-balance balance-due-text">{{v28}}</div>
              <span class="badge badge-due">{{v29}}</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/mateo/pay" class="btn btn-primary btn-sm">{{v30}}</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-mateo" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-mateo">
                    <a href="#/booking/mateo" class="dropdown-item">View details</a>
                    <a href="#/booking/mateo/edit" class="dropdown-item">Edit breakdown</a>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Row 4: Devon Washington (Needs Price) -->
          <tr class="ledger-row" data-status="attention upcoming" data-guest="Devon Washington" data-contract="C-2026-098">
            <td>
              <div class="date-block">
                <span class="date-block-month">Dec</span>
                <span class="date-block-day">{{v31}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4><a href="#/booking/devon" style="color: var(--text);">Devon Washington Gala</a></h4>
                <p>{{v32}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right; color: var(--muted); font-style: italic;">Not agreed</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v33}}</td>
            <td class="financial-cell" style="text-align: right;">
              <div class="financial-balance" style="color: var(--muted);">&mdash;</div>
              <span class="badge badge-unpriced badge-long">Needs agreed price</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/devon/edit" class="btn btn-quiet btn-sm">Set price</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-devon" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-devon">
                    <a href="#/booking/devon" class="dropdown-item">View details</a>
                    <a href="#/booking/devon/pay" class="dropdown-item">Record payment</a>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Row 5: Chloe Nguyen (Balance Due) -->
          <tr class="ledger-row" data-status="due upcoming" data-guest="Chloe Nguyen" data-contract="C-2026-101">
            <td>
              <div class="date-block">
                <span class="date-block-month">Dec</span>
                <span class="date-block-day">{{v34}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4><a href="#/booking/chloe" style="color: var(--text);">Chloe Nguyen &amp; Kevin Park</a></h4>
                <p>{{v35}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v36}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v37}}</td>
            <td class="financial-cell" style="text-align: right;">
              <div class="financial-balance balance-due-text">{{v38}}</div>
              <span class="badge badge-due">{{v39}}</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/chloe/pay" class="btn btn-primary btn-sm">{{v40}}</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-chloe" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-chloe">
                    <a href="#/booking/chloe" class="dropdown-item">View details</a>
                    <a href="#/booking/chloe/edit" class="dropdown-item">Edit breakdown</a>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Row 6: Blocked Date (Christmas Closure) -->
          <tr class="ledger-row" data-status="upcoming" data-guest="Venue Hold" data-contract="HOLD-2026-04">
            <td>
              <div class="date-block" style="background-color: var(--surface-alt);">
                <span class="date-block-month">Dec</span>
                <span class="date-block-day">{{v41}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4>Christmas Holiday Closure</h4>
                <p>{{v42}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right; color: var(--muted);">&mdash;</td>
            <td class="financial-cell" style="text-align: right; color: var(--muted);">&mdash;</td>
            <td class="financial-cell" style="text-align: right;">
              <span class="badge badge-blocked">Blocked date</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <button type="button" class="btn btn-quiet btn-sm">Release hold</button>
              </div>
            </td>
          </tr>

          <!-- Month Divider 3: JANUARY - APRIL 2027 -->
          <tr style="background-color: var(--bg-subtle);">
            <td colspan="6" style="padding: 10px 16px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);">{{v43}}</td>
          </tr>

          <!-- Row 7: Liam & Emma Johnson (Balance Due) -->
          <tr class="ledger-row" data-status="due upcoming" data-guest="Liam & Emma Johnson" data-contract="C-2027-003">
            <td>
              <div class="date-block">
                <span class="date-block-month">Jan</span>
                <span class="date-block-day">{{v44}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4><a href="#/booking/liam" style="color: var(--text);">Liam &amp; Emma Johnson Vow Renewal</a></h4>
                <p>{{v45}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v46}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v47}}</td>
            <td class="financial-cell" style="text-align: right;">
              <div class="financial-balance balance-due-text">{{v48}}</div>
              <span class="badge badge-due">{{v49}}</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/liam/pay" class="btn btn-primary btn-sm">{{v50}}</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-liam" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-liam">
                    <a href="#/booking/liam" class="dropdown-item">View details</a>
                    <a href="#/booking/liam/edit" class="dropdown-item">Edit breakdown</a>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Row 8: Twin Cities Youth Arts (Paid in full) -->
          <tr class="ledger-row" data-status="upcoming" data-guest="Twin Cities Youth Arts" data-contract="C-2027-009">
            <td>
              <div class="date-block">
                <span class="date-block-month">Feb</span>
                <span class="date-block-day">{{v51}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4>Twin Cities Youth Arts Fundraiser</h4>
                <p>{{v52}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v53}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v54}}</td>
            <td class="financial-cell" style="text-align: right;">
              <div class="financial-balance" style="color: var(--success-text);">{{v55}}</div>
              <span class="badge badge-paid">Paid in full</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/fundraiser" class="btn btn-quiet btn-sm">Details</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-fundraiser" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-fundraiser">
                    <a href="#/booking/fundraiser" class="dropdown-item">View details</a>
                    <a href="#/booking/fundraiser/edit" class="dropdown-item">Edit price breakdown</a>
                    <a href="#/booking/fundraiser" class="dropdown-item">Contract copy (PDF)</a>
                    <div class="dropdown-divider"></div>
                    <button type="button" class="dropdown-item" style="color: var(--danger-text);">Cancel booking</button>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Row 9: Jordan Patel (Balance Due) -->
          <tr class="ledger-row" data-status="due upcoming" data-guest="Jordan Patel" data-contract="C-2027-014">
            <td>
              <div class="date-block">
                <span class="date-block-month">Mar</span>
                <span class="date-block-day">{{v56}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4>Jordan Patel Medical Graduation</h4>
                <p>{{v57}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v58}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v59}}</td>
            <td class="financial-cell" style="text-align: right;">
              <div class="financial-balance balance-due-text">{{v60}}</div>
              <span class="badge badge-due">{{v61}}</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/jordan/pay" class="btn btn-primary btn-sm">{{v62}}</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-jordan" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-jordan">
                    <a href="#/booking/jordan" class="dropdown-item">View details</a>
                    <a href="#/booking/jordan/edit" class="dropdown-item">Edit price breakdown</a>
                    <a href="#/booking/jordan" class="dropdown-item">Contract copy (PDF)</a>
                    <div class="dropdown-divider"></div>
                    <button type="button" class="dropdown-item" style="color: var(--danger-text);">Cancel booking</button>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Row 10: Aria & Noah Kim (Cancelled) -->
          <tr class="ledger-row" data-status="cancelled" data-guest="Aria & Noah Kim" data-contract="C-2027-020" style="opacity: 0.85;">
            <td>
              <div class="date-block" style="background-color: var(--cancelled-bg);">
                <span class="date-block-month">Apr</span>
                <span class="date-block-day">{{v63}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4 style="text-decoration: line-through;">Aria &amp; Noah Kim Wedding</h4>
                <p>{{v64}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right; text-decoration: line-through; color: var(--muted);">{{v65}}</td>
            <td class="financial-cell" style="text-align: right;">{{v66}}</td>
            <td class="financial-cell" style="text-align: right;">
              <span class="badge badge-cancelled badge-long">Cancelled &middot; Fee settled</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/arianoah" class="btn btn-quiet btn-sm">Review</a>
                <button type="button" class="btn btn-quiet btn-sm">Restore</button>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-arianoah" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-arianoah">
                    <a href="#/booking/arianoah" class="dropdown-item">View details</a>
                    <a href="#/booking/arianoah/edit" class="dropdown-item">Edit price breakdown</a>
                    <div class="dropdown-divider"></div>
                    <button type="button" class="dropdown-item" style="color: var(--danger-text);">Restore</button>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Past Events Divider -->
          <tr style="background-color: var(--bg-subtle);">
            <td colspan="6" style="padding: 10px 16px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);">
              Past Completed Events (Archived)
            </td>
          </tr>

          <!-- Row 11: Julian Sterling (Settled) -->
          <tr class="ledger-row" data-status="past" data-guest="Julian Sterling" data-contract="C-2026-078">
            <td>
              <div class="date-block" style="background-color: var(--settled-bg);">
                <span class="date-block-month">Oct</span>
                <span class="date-block-day">{{v67}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4>{{v68}}</h4>
                <p>{{v69}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v70}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v71}}</td>
            <td class="financial-cell" style="text-align: right;">
              <span class="badge badge-settled">Settled</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/julian" class="btn btn-quiet btn-sm">Details</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-julian" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-julian">
                    <a href="#/booking/julian" class="dropdown-item">View details</a>
                    <a href="#/booking/julian/edit" class="dropdown-item">Edit price breakdown</a>
                    <a href="#/booking/julian" class="dropdown-item">Contract copy (PDF)</a>
                    <div class="dropdown-divider"></div>
                    <button type="button" class="dropdown-item" style="color: var(--danger-text);">Cancel booking</button>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Row 12: Elena Rostova (Past - Attention Mismatch) -->
          <tr class="ledger-row" data-status="past attention" data-guest="Elena Rostova" data-contract="C-2026-071">
            <td>
              <div class="date-block" style="background-color: var(--settled-bg);">
                <span class="date-block-month">Oct</span>
                <span class="date-block-day">{{v72}}</span>
              </div>
            </td>
            <td>
              <div class="guest-info">
                <h4>Elena Rostova Baby Shower</h4>
                <p>{{v73}}</p>
              </div>
            </td>
            <td class="financial-cell" style="text-align: right;">{{v74}}</td>
            <td class="financial-cell" style="text-align: right; color: var(--success-text);">{{v75}}</td>
            <td class="financial-cell" style="text-align: right;">
              <span class="badge badge-due badge-long">{{v76}}</span>
            </td>
            <td>
              <div class="row-actions-cell">
                <a href="#/booking/elena" class="btn btn-quiet btn-sm">Reconcile</a>
                <div class="row-dropdown">
                  <button type="button" class="btn btn-quiet btn-sm" data-toggle-menu="menu-elena" aria-expanded="false" aria-label="More actions">•••</button>
                  <div class="dropdown-menu" id="menu-elena">
                    <a href="#/booking/elena" class="dropdown-item">View details</a>
                    <a href="#/booking/elena/edit" class="dropdown-item">Edit price breakdown</a>
                    <a href="#/booking/elena" class="dropdown-item">Contract copy (PDF)</a>
                    <div class="dropdown-divider"></div>
                    <button type="button" class="dropdown-item" style="color: var(--danger-text);">Cancel booking</button>
                  </div>
                </div>
              </div>
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
    .row-dropdown {
      position: relative;
      display: inline-block;
    }
    .dropdown-menu {
      display: none;
      position: absolute;
      right: 0;
      top: 100%;
      background-color: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-md);
      z-index: 60;
      min-width: 170px;
      padding: 4px 0;
      margin-top: 4px;
    }
    .dropdown-menu[open] {
      display: flex;
      flex-direction: column;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 8px 14px;
      font-size: 12px;
      color: var(--text);
      text-decoration: none;
      cursor: pointer;
      text-align: left;
      border: none;
      background: none;
      width: 100%;
    }
    .dropdown-item:hover {
      background-color: var(--surface-hover);
      color: var(--accent);
      text-decoration: none;
    }
    .dropdown-divider {
      height: 1px;
      background-color: var(--line-subtle);
      margin: 4px 0;
    }
  `;
export default data => markup.replace(/\{\{(v\d+)\}\}/g, (_, key) => data[key]);
